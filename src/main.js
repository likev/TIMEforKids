import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

import jquery from "jquery/src/jquery.js";
import bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min.js';
//import moment from 'moment';

window.$ = jquery;
window.bootstrap = bootstrap;

import config from './config';
import create_edge_TTS from './edge-tts';
//import { fixedEncodeURIComponent, getUTCTimeStr } from "./utils"


async function get_article_lists(article_lists_URL) {
    const f = await fetch(`${config['CORS-PROXY']}/${config.TIMEforKids}/${article_lists_URL}/`, {
        //"mode": "cors"
    });
    const html = await f.text();
    console.log(html);
    const main = $(html).find('main').html();
    console.log(main)
    return `<main>${main}</main>`;
}

async function get_article(article_URL) {
    const f = await fetch(`${config['CORS-PROXY']}/${config.TIMEforKids}/${article_URL}/`, {
        //"mode": "cors"
    });
    const html = await f.text();
    console.log(html);
    const main = $(html).find('div.article-show').html(); //.article-show__content
    console.log(main)
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

        this.href = '/#'+ href.split('/').slice(3,-1).join(`/`);
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
    console.log(mainHtml);

    const main = replace_article_links(mainHtml);

    $('#main').html(main);
}

async function update_article(article_URL) {
    const mainHtml = await get_article(article_URL);
    console.log(mainHtml);

    const main = replace_article_links(mainHtml);

    $('#main').html(main);

    $('.article-show__content-article > p').each(function () {
        let text = $(this).text();

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
    })

    $('.read-p').on('click', async function () {
        const text = $(this).data('text');
        try {
            var tts = await create_edge_TTS();
            tts.setVoice('en-US-AnaNeural'); // 'en-US-AriaNeural'

            await tts._(text)

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

    $('#main').on('click', 'a', function () {
        const levels = ['k1', 'g2', 'g34', 'g56'];
        const splits = $(this).data('href').split('/');

        if (levels.includes(splits.at(-3))) {//it is an article
            const article_URL = splits.at(-3) + '/' + splits.at(-2);
            console.log(article_URL);
            update_article(article_URL);
        } else {//it is an article_lists
            article_lists_URL = splits.slice(3, -1).join('/');
            update_article_lists(article_lists_URL);
        }

        return false;
    })
})
