import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

import jquery from "jquery/src/jquery.js";
import bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min.js';
//import moment from 'moment';

window.$ = jquery;
window.bootstrap = bootstrap;

import config from './config';
//import { fixedEncodeURIComponent, getUTCTimeStr } from "./utils"

let article_lists_URL = 'g2'
async function get_article_lists() {
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
        this.href = href.replace(`${config.TIMEforKids}`, `${config['CORS-PROXY']}/${config.TIMEforKids}`);
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

async function update_article_lists() {
    const mainHtml = await get_article_lists();
    console.log(mainHtml);
    
    const main = replace_article_links(mainHtml);

    $('#main').html(main);
}

async function update_article(article_URL) {
    const mainHtml = await get_article(article_URL);
    console.log(mainHtml);
    
    const main = replace_article_links(mainHtml);

    $('#main').html(main);

}

//document is ready
$(function () {
    update_article_lists()

    $('#main').on('click','.c-article-preview__image a, .c-article-preview__title a, .c-article-preview__text a', function(){
        const splits = this.href.split('/');
        const article_URL = splits.at(-3) + '/' + splits.at(-2);
        console.log(article_URL);
        update_article(article_URL);
        return false;
    })
})
