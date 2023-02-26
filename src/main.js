import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

import jquery from "jquery/src/jquery.js";
import bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min.js';
//import moment from 'moment';

window.$ = jquery;
window.bootstrap = bootstrap;

import config from './config';
import create_edge_TTS from './edge-tts';
import { Polyfill } from "./utils";

Polyfill();

const DEBUG_MOBILE = false;

let console = {};

if (DEBUG_MOBILE) {
    console.log = function (text) {
        $('body').prepend(text);
    }

} else {
    console = window.console;
}


async function get_article_lists(article_lists_URL) {
    const f = await fetch(`${config['CORS-PROXY']}/${config.TIMEforKids}/${article_lists_URL}/`, {
        //"mode": "cors"
    });
    const html = await f.text();
    //console.log(html);
    const main = $(html).find('main').html();
    //console.log(main)
    return `<main>${main}</main>`;
}

async function get_article(article_URL) {
    const f = await fetch(`${config['CORS-PROXY']}/${config.TIMEforKids}/${article_URL}/`, {
        //"mode": "cors"
    });
    const html = await f.text();
    //console.log(html);
    const main = $(html).find('div.article-show').html(); //.article-show__content
    //console.log(main)
    return `<div>${main}</div>`;
}

async function fetchImage(url) {
    let response = await fetch(url);
    let blob = await response.blob();
    let blobUrl = URL.createObjectURL(blob);
    return blobUrl;
}

function replace_article_links(mainHtml) {
    const main = $(mainHtml);
    main.find('a').each(function () {
        let href = this.href;
        $(this).attr('data-href', href);

        this.href = '/#' + href.split('/').slice(3, -1).join(`/`);
    })

    main.find('img').each(function () {
        let that = this;

        async function set() {
            let src = that.src;
            src = src.replace(`${config.TIMEforKids}`, `${config['CORS-PROXY']}/${config.TIMEforKids}`);
            that.src = await fetchImage(src);
        }

        set();

    })

    return main;
}

async function update_article_lists(article_lists_URL) {
    const mainHtml = await get_article_lists(article_lists_URL);
    //console.log(mainHtml);

    const main = replace_article_links(mainHtml);

    $('#main').html(main);
}

function create_modal(title, body) {
    const modal_html = `<div class="modal fade" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">${title}</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">

        </div>
        
      </div>
    </div>
  </div>`;

    const jQmodal = $(modal_html);
    jQmodal.find('.modal-body').html(body); //equal to empty().append(body);

    const myModal = new bootstrap.Modal(jQmodal[0]);
    return myModal;
}

async function update_article(article_URL) {
    const mainHtml = await get_article(article_URL);
    //console.log(mainHtml);

    const main = replace_article_links(mainHtml);

    $('#main').html(main);

    $('.article-show__content-article > p').each(function () {
        //translate
        const p_clone = $(this).clone();
        p_clone.find('.definition').remove();

        let text = p_clone.text();

        $(this).addClass('article-english').prepend(`<button class="read-p" data-text="${text}">Read...</button>`);

        let that = this;

        async function set() {
            //'https://cooperative-cuff-elk.cyclic.app/https://translate-service.scratch.mit.edu/translate?language=zh&text=hello world'
            const url = `${config['CORS-PROXY']}/https://translate-service.scratch.mit.edu/translate?language=zh&text=${text}`;

            let f = await fetch(url);
            let zh_text = await f.json();

            $(that).after(`<p class='translate-zh'>${zh_text.result}</p>`);
        }

        set();

        //powerword
        const definition = $(this).find('.powerword .definition');
        if (!definition.length) return;

        const powerword_title = definition.find('.title').text();

        definition.find('.title, .close').remove();

        const powerword_modal = create_modal(powerword_title, definition);

        $(this).find('.powerword').on('click', function(){
            powerword_modal.show();
        })

    })

    $('.read-p').on('click', async function () {
        const text = $(this).data('text'), audio_url = $(this).data('url');

        if (audio_url) {//we have store the url;
            const audio = new Audio(audio_url);
            await audio.play();

            return;
        }

        //else try create new tts
        try {
            const tts = await create_edge_TTS();
            tts.setVoice('en-US-AnaNeural'); // 'en-US-AriaNeural'

            const new_url = await tts._(text);

            $(this).attr('data-url', new_url);

        } catch (e) {
            console.log('catch error:')
            console.log(e)
        }
    })

}

//document is ready
$(function () {
    let article_lists_URL = 'g2';
    update_article_lists(article_lists_URL);

    $('#main').on('click', 'a', function (e) {
        console.log(JSON.stringify(e));
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('#main a click begin');

        const levels = ['k1', 'g2', 'g34', 'g56'];
        const splits = $(this).data('href').split('/');

        try {
            console.log('#main a click begin check begin');
            if (levels.includes(splits.at(-3))) {//it is an article
                console.log('#main a click begin article');

                const article_URL = splits.at(-3) + '/' + splits.at(-2);
                console.log(article_URL);

                console.log('#main a click update_article begin');
                update_article(article_URL);
                console.log('#main a click update_article end');
            } else {//it is an article_lists
                console.log('#main a click begin article_lists');

                article_lists_URL = splits.slice(3, -1).join('/');

                console.log('#main a update_article_lists begin');
                update_article_lists(article_lists_URL);
                console.log('#main a update_article_lists end');
            }
        } catch (e) {
            const { name, message, cause } = e;
            console.log(JSON.stringify({ name, message, cause }))
        }

        console.log('#main a click end');

        return false;
    })
})
