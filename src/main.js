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
    const f = await fetch("https://cooperative-cuff-elk.cyclic.app/https://www.timeforkids.com/g2/", {
      //"mode": "cors"
    });
    const html = await f.text();
    //console.log(html);
    const main = $(html).find('#site > main').html();
    //console.log( main )
    return main;
}
  
  

//document is ready
$(async function () {
    $('#main').html(await get_article_lists());
})
