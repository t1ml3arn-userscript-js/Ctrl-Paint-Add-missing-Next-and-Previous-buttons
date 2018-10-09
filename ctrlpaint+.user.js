// ==UserScript==
// @name ctrlpaint tutorial series connector
// @namespace https://github.com/T1mL3arn
// @description Adds next/prev buttons for some tutorial series
// @author T1mL3arn
// @version 0.2
// @icon https://static1.squarespace.com/static/50a3c190e4b0d12fc9231429/t/50f87f8ce4b0b3f0a2deeb1d/1537054440579/
// @match https://www.ctrlpaint.com/* 
// @run-at document-end
// @noframes
// @grant GM_setValue
// @grant GM_getValue
// @grant GM_deleteValue
// @grant GM_listValues
// @license GPLv3 
// @homepageURL 
// @supportURL 
// @downloadURL 
// @updateURL 
// ==/UserScript==

(function () {
    // lib section
    let log = console.log;
    let err = console.error;
    function findHeader(elt){
        let prev = elt;
        while(prev = prev.previousSibling)
            if(prev.tagName == 'H3')
                return prev;
        return null;
    }
    function mapsListItemsToNames(list){
        let items = list.querySelectorAll('li > a');
        let result = [];
        items.forEach((item)=>result.push(item.textContent));
        return result;
    }
    function mapListItemsToLinks(list){
        let items = list.querySelectorAll('li > a');
        let result = [];
        items.forEach((item)=>result.push(item.href));
        return result;
    }
    function readSeriesFrom(document){
        let lists = document.querySelectorAll('ol, ul');
        let results = [];

        lists.forEach((list)=>{

            // skip empty lists
            if(list.children.length == 0)
                return;
            
            let header = findHeader(list);
            if(header){
                let links = mapListItemsToLinks(list);
                if(links.length > 0){
                    let names = mapsListItemsToNames(list);

                    // just to be sure
                    if(names.length != links.length){
                        throw `Count of links isn\'t equal to count of names\nProblem in ${header.textContent}`;
                    }

                    results.push({
                        name: header.textContent,
                        videoNames: names,
                        videoLinks: links,
                        headerElt: header
                    });
                }
            }
        });
        log(results);
        if(results.length == 0)
            throw 'There are no tutorial series at all!';
        return results;
    }
    function findTutorialSeriesDataForCurrentPage() {
        let path = window.location.pathname;
        let videoIndex;
        let index = TUTORIAL_SERIES.findIndex((seriesData)=>{
            videoIndex = seriesData.videoLinks.findIndex((link)=>path != "/" && link.indexOf(path) != -1)
            return videoIndex != -1;
        });

        if(index == -1)
            return null;
        
        let seriesData = TUTORIAL_SERIES[index];
        seriesData.currentVideoIndex = videoIndex;
        return seriesData;
    }
    function addButtons(seriesData) {
        
        function getButtonHtml(href, label, name) {

            return `<div class="button-block sqs-block-button" data-block-type="53" style="${btnCss}">
            <div class="sqs-block-content">
                <div class="sqs-block-button-container--center" data-alignment="center" data-button-size="small">
                    <a href="${href}" class="sqs-block-button-element--small sqs-block-button-element" data-initialized="true">
                    ${label}
                    ${name ? 
                    `<br>
                    <span style="${videoNameCss}">${name}</span>` : ''
                    }
                    </a>
                </div>
            </div>
            </div>`
        }
        function arrayToCss(acc, val, ind){
            return ind%2 == 0 ? `${acc}${val}: ` : `${acc}${val} !important; `;
        }

        let btnCss = ["flex", "0 1 auto", "align-self", "auto", "margin", "10px"].reduce(arrayToCss, '');
        let videoNameCss = "font-size, 11px, text-transform, none, color, #DDD".split(", ").reduce(arrayToCss);
        let btnContCss = [
            "display", "flex",
            "flex-direction", "row",
            "flex-wrap", "wrap",
            "justify-content", "space-around",
            "align-content", "center",
            "align-items", "center",
            "padding", "15px",
        ].reduce(arrayToCss, '');

        let buttonsWrapper = document.createElement('div');
        buttonsWrapper.setAttribute('style', btnContCss);

        let videoBlock = document.querySelector('.sqs-block.embed-block.sqs-block-embed');
        if(videoBlock == null)
            throw 'There is no video block';

        videoBlock.insertAdjacentElement('afterend', buttonsWrapper);
        
        let names = seriesData.videoNames;
        let links = seriesData.videoLinks;
        let index = seriesData.currentVideoIndex;
        
        log(seriesData.name, names[index], links[index], seriesData);

        let nextHtml = index+1 < names.length ? getButtonHtml(links[index+1], 'NEXT', names[index+1]) : '';
        let prevHtml = index-1 > -1 ? getButtonHtml(links[index-1], 'PREVIOUS', names[index-1]) : '';

        buttonsWrapper.insertAdjacentHTML('beforeend', prevHtml);
        buttonsWrapper.insertAdjacentHTML('beforeend', nextHtml);
    }
    function patchSeriesData(seriesDataList) {
        
        try {
            let data = seriesDataList.find((seriesData) => seriesData.name.indexOf('Painting With Color') != -1);
            let index = data.videoNames.indexOf('Color Constructor Pt.2 Exercises');
            data.videoLinks[index] = 'https://www.ctrlpaint.com/videos/color-constructor-pt2-exercises';
        } catch (e) {
            err('Patch-1 error', e);
        }
        
        // remove the first series cause it has next/prev buttons
        index = seriesDataList.findIndex((seriesData) => seriesData.name.indexOf('Digital Painting 101') != -1);
        if(index != -1)
            seriesDataList.splice(index, 1);
        else
            throw 'Patch-2 error';
        
        return seriesDataList;
    }

    let SCRIPT_HANDLER;
    let GM = {};

    let TUTORIAL_SERIES;
    const TUTORIAL_SERIES_KEY = 'tutorial_series_key';

    try {
        log(`
        [ ${GM_info.script.name} ] inited
        Script handler is ${GM_info.scriptHandler}
        `);
        log(GM_info);
        SCRIPT_HANDLER = GM_info.scriptHandler;

        GM.info = GM_info;
        GM.getValue = function (key, default_) {
            if(SCRIPT_HANDLER=='Violentmonkey')
                return Promise.resolve(GM_getValue(key, default_));
            else
                return GM_getValue(key, default_);
        };
        GM.setValue = function (key, value) {
            if(SCRIPT_HANDLER=='Violentmonkey')
                return Promise.resolve(GM_setValue(key, value));
            else
                return GM_setValue(key, value);
        };
        GM.deleteValue = function (key) {
            if(SCRIPT_HANDLER=='Violentmonkey'){
                GM_deleteValue(key);
                return Promise.resolve();
            } else {
                return GM_deleteValue(key);
            }
        };
        GM.listValues = function () {
            if(SCRIPT_HANDLER=='Violentmonkey')
                return Promise.resolve(GM_listValues());
            else
                return GM_listValues();
        };
    } catch (e) {
        log('ctrlpaint+ inited partialy. Something went wrong.');
    }

    // structure sample
    let series ={
        name: 'First Steps',                /* Name of chapter */
        videoNames: ['welcome', 'tut01'],   /* Names of all videos in this chapter  */
        videoLinks: ['#', '#'],             /* Links to each video in this chapter */
        currentVideoIndex: -1               /* Uses to find previous or next video in this chapter */
    };

    (async ()=>{
        TUTORIAL_SERIES = await GM.getValue(TUTORIAL_SERIES_KEY, null);
        
        if(TUTORIAL_SERIES == null){
            // FIRST TIME!
            
            let libPageEreg = /\/library\//i;
            
            if(libPageEreg.test(window.location.pathname)){
                // library page, collect the series!
                
                TUTORIAL_SERIES = readSeriesFrom(document);
                TUTORIAL_SERIES = patchSeriesData(TUTORIAL_SERIES);

                await GM.setValue(TUTORIAL_SERIES_KEY, TUTORIAL_SERIES);
            } else {
                // not a library page, need to fetch that page first

                let response = await fetch('https://www.ctrlpaint.com/library/');
                if(!response.ok) throw 'Cannot fetch library page at https://www.ctrlpaint.com/library/';
                
                let pageText = await response.text();
                let libraryDocument = new DOMParser().parseFromString(pageText, 'text/html');

                TUTORIAL_SERIES = readSeriesFrom(libraryDocument);
                TUTORIAL_SERIES = patchSeriesData(TUTORIAL_SERIES);

                await GM.setValue(TUTORIAL_SERIES_KEY, TUTORIAL_SERIES);
            }
        }

        // check if current page is a VIDEO page
        let seriesData = findTutorialSeriesDataForCurrentPage();
        if(seriesData != null){
            addButtons(seriesData);
        }

    })();
    
    // tests section end ---------
})();