import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

import jquery from "jquery/src/jquery.js";
import bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min.js';
//import moment from 'moment';

window.$ = jquery;
window.bootstrap = bootstrap;

import config from './config';
//import { fixedEncodeURIComponent, getUTCTimeStr } from "./utils"

async function get_article_lists() {
    const f = await fetch(`${config['CORS-PROXY']}/${config.TIMEforKids}/g2/`, {
        //"mode": "cors"
    });
    const html = await f.text();
    console.log(html);
    const main = $(html).find('main').html();
    console.log(main)
    return `<main>${main}</main>`;
}

async function fetchImage(url) {
    let response = await fetch(url);
    let blob = await response.blob();
    let blobUrl = URL.createObjectURL(blob);
    return blobUrl;
}


//document is ready
$(async function () {
    const mainHtml = await get_article_lists();
    console.log(mainHtml);
    const main = $(mainHtml);
    main.find('a').each(function () {
        let href = this.href;
        this.href = href.replace("https://www.timeforkids.com/", `${config['CORS-PROXY']}/https://www.timeforkids.com/`);
    })

    main.find('img').each(function () {
        let that = this;

        async function set() {
            let src = that.src;
            src = src.replace("https://www.timeforkids.com/", `${config['CORS-PROXY']}/https://www.timeforkids.com/`);
            that.src = await fetchImage(src);
        }

        set();

    })

    $('#main').html(main);
})
