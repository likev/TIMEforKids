function create_edge_TTS({ timeout = 10, auto_reconnect = true } = {}) {

    const TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4";
    const VOICES_URL = `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/voices/list?trustedclienttoken=${TRUSTED_CLIENT_TOKEN}`;
    const SYNTH_URL = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${TRUSTED_CLIENT_TOKEN}`;
    const BINARY_DELIM = "Path:audio\r\n";
    const VOICE_LANG_REGEX = /\w{2}-\w{2}/;

    let _outputFormat = "audio-24khz-48kbitrate-mono-mp3";
    let _voiceLocale = 'zh-CN',
        _voice = 'zh-CN-XiaoxiaoNeural';

    const _queue = {
        message: [],
        url_resolve: {},
        url_reject: {},
    };

    let ready = false;

    function _SSMLTemplate(input) {
        return `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="https://www.w3.org/2001/mstts" xml:lang="${_voiceLocale}">
                  <voice name="${_voice}">
                      ${input}
                  </voice>
              </speak>`;
    }

    function uuidv4() {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }

    let socket = null;
    create_new_ws();

    function setFormat(format) {
        if (format) _outputFormat = format;

        /**/
        socket.send(`Content-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n
                      {
                          "context": {
                              "synthesis": {
                                  "audio": {
                                      "metadataoptions": {
                                          "sentenceBoundaryEnabled": "false",
                                          "wordBoundaryEnabled": "false"
                                      },
                                      "outputFormat": "${_outputFormat}" 
                                  }
                              }
                          }
                      }
                  `);
    }

    async function createURL(requestId) {
        let index_message = 0;
        for (let message of _queue.message) {
            const isbinary = message instanceof Blob;

            if (!isbinary) continue;

            const data = await message.text();

            //console.log(data); //does the message order change?
            //console.log(await event.data.arrayBuffer());

            const Id = /X-RequestId:(.*?)\r\n/gm.exec(data)[1];

            if (Id !== requestId) continue;

            if (data.charCodeAt(0) === 0x00 && data.charCodeAt(1) === 0x67 && data.charCodeAt(2) === 0x58) {
                // Last (empty) audio fragment
                console.log(`Last (empty) audio fragment`)

                const blob = new Blob(_queue[requestId], {
                    'type': 'audio/mp3'
                });

                _queue[requestId] = null; //release memory

                const url = URL.createObjectURL(blob);
                console.log(url)

                //URL.revokeObjectURL(url);
                _queue.url_resolve[requestId](url);

                //return url

            } else {
                const index = data.indexOf(BINARY_DELIM) + BINARY_DELIM.length;

                const audioData = message.slice(index);
                _queue[requestId].push(audioData);

                _queue.message[index_message] = null; //release blob memory
            }

            ++index_message;
        }
    }

    function onopen(event) {
        console.log('open');
        //socket.send('Hello Server!');
        //socket.close()

        setFormat();
        ready = true;
    }

    async function onmessage(event) {
        const isbinary = event.data instanceof Blob;
        console.log(`Message from server, type: ${typeof (event.data)} Blob: ${isbinary}`);

        _queue.message.push(event.data)

        if (!isbinary) {
            //console.log(event.data);
            const requestId = /X-RequestId:(.*?)\r\n/gm.exec(event.data)[1];

            if (event.data.includes("Path:turn.end")) {
                // end of turn
                createURL(requestId);
            }

        } else {

        }
    }

    function onerror(event) {
        ready = false;
        console.log('WebSocket error: ', event);
    }

    function onclose(event) {
        ready = false;
        console.log('WebSocket close: ', event); //may be closed by remote
    }

    function addSocketListeners() {
        socket.addEventListener('open', onopen);
        // Listen for messages
        socket.addEventListener('message', onmessage);

        // Listen for possible errors
        socket.addEventListener('error', onerror);

        // Listen for possible errors
        socket.addEventListener('close', onclose);
    }

    function create_new_ws() {
        //try {
        // Create WebSocket connection.
        socket = new WebSocket(SYNTH_URL);
        addSocketListeners();
    }

    let toStream = function (input) {
        let requestSSML = _SSMLTemplate(input);
        const requestId = uuidv4().replaceAll('-', '');
        const request = `X-RequestId:${requestId}\r\nContent-Type:application/ssml+xml\r\nPath:ssml\r\n\r\n
                  ` + requestSSML.trim();

        _queue[requestId] = [];

        return new Promise((resolve, reject) => {
            _queue.url_resolve[requestId] = resolve, _queue.url_reject[requestId] = reject;

            if (!ready) {
                if (auto_reconnect) {
                    create_new_ws();
                    socket.addEventListener('open', _ => socket.send(request));

                    setTimeout(_ => { if (!ready) reject('reconnect timeout') }, timeout * 1000);
                }
                else reject('socket error or timeout');
            } else {
                socket.send(request)
            }

        });

    }

    async function play(input, play_count = 1, play_span = 5000) {
        const url = await toStream(input);

        let play_resolve = function () { };

        var audio = new Audio(url);
        console.log('before play' + audio.duration) //NaN

        //let play_count = 3; //repeat times
        audio.onended = (e) => {
            console.log(e);
            if (--play_count) setTimeout(_ => audio.play(), play_span);
            else {
                //URL.revokeObjectURL(url);
                play_resolve(url);
                console.log('play end');
            }
        }

        await audio.play();
        console.log('after play' + audio.duration);

        return new Promise((resolve, reject) => {
            play_resolve = resolve
        });

    }

    return new Promise((resolve, reject) => {
        setTimeout(_ => reject('socket open timeout'), timeout * 1000);
        // Connection opened
        socket.addEventListener('open', function (event) {

            resolve({
                _: play,
                toStream,
                setVoice: (voice, locale) => {
                    _voice = voice;
                    if (!locale) {
                        const voiceLangMatch = VOICE_LANG_REGEX.exec(_voice);
                        if (!voiceLangMatch) throw new Error("Could not infer voiceLocale from voiceName!");
                        _voiceLocale = voiceLangMatch[0];
                    } else {
                        _voiceLocale = locale;
                    }
                },
                setFormat,
                isReady: _ => ready
            })

        });
    });

}

export default create_edge_TTS;

//-------------------------------

async function test() {
    try {
        var tts = await create_edge_TTS();

        await tts._('天气很好', 3, 5000)
        await tts._('心情不错. ')

    } catch (e) {
        console.log('catch error:')
        console.log(e)
    }
}

//test();