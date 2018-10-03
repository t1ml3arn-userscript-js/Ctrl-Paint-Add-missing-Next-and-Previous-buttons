// ==UserScript==
// @name ctrlpaint site improver
// @namespace 
// @description Adds next/prev buttons for some tutorial series
// @author T1m
// @version 0.1
// @icon 
// @match https://www.ctrlpaint.com/*
// @exclude-match 
// @require 
// @resource 
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
    function mapListItemsNames(list){
        let items = list.querySelectorAll('li > a');
        let result = [];
        items.forEach((item)=>result.push(item.textContent));
        return result;
    }
    function mapListItemsLinks(list){
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
                let links = mapListItemsLinks(list);
                if(links.length > 0){
                    let names = mapListItemsNames(list);

                    // just to be sure
                    if(names.length != links.length){
                        throw 'Count of links isn\'t equal to count of names';
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
    function getTutorialSeriesData() {
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
        throw 'Not implemented';
    }

    // testing vars section start ---------
    
    const FIRST_TIME = 1;
    const LIB_PAGE = 2;
    const PARSE_LIB_PAGE = 3;
    const SAVE_TUTOR_DATA = 4;
    const FETCH_LIB_PAGE = 4;
    const SEQUENCE_1 = [FIRST_TIME, LIB_PAGE, PARSE_LIB_PAGE, SAVE_TUTOR_DATA].join();
    const SEQUENCE_2 = [FIRST_TIME, -LIB_PAGE, FETCH_LIB_PAGE, PARSE_LIB_PAGE, SAVE_TUTOR_DATA].join();
    let ___TEST_SEQUENCE___ = [];
    
    // testing vars section end ---------

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
    
    // if this is a video series page - show add buttons to next/previous videos
    // Also answer this comment when you done https://www.ctrlpaint.com/videos/ctrlpaint-unplugged-road-map
    
    // 1. check if a page is a part of video series
    // 2. if so - add buttons to related videos 

    /**
     * How to know if a page is part of series?
     * - You need to parse this page https://www.ctrlpaint.com/library/
     * and create appropriate structures FOR ALL series.
     * - Also it is needed to store info in settings.
     */

    // structure sample
    let series ={
        name: 'Test Name',
        videoNames: ['welcome', 'tut01'],
        videoLinks: ['#', '#'],
        currentVideoIndex: -1
    }

    // need a way to check if this is the first time user visits this site
    (async ()=>{
        TUTORIAL_SERIES = await GM.getValue(TUTORIAL_SERIES_KEY, null);

        if(TUTORIAL_SERIES == null){
            // FIRST TIME!
            // ___TEST_SEQUENCE___.push(FIRST_TIME);
            let libPageEreg = /\/library\//i;
    
            if(libPageEreg.test(window.location.pathname)){
                // library page, collect the series!
                // ___TEST_SEQUENCE___.push(LIB_PAGE);

                TUTORIAL_SERIES = readSeriesFrom(document);

                // ___TEST_SEQUENCE___.push(PARSE_LIB_PAGE);
                await GM.setValue(TUTORIAL_SERIES_KEY, TUTORIAL_SERIES);
                // ___TEST_SEQUENCE___.push(SAVE_TUTOR_DATA);
            } else {
                // not a library page, need to fetch that page first
                // ___TEST_SEQUENCE___.push(-LIB_PAGE);
                
                let response = await fetch('https://www.ctrlpaint.com/library/');
                if(!response.ok) throw 'Cannot fetch library page at https://www.ctrlpaint.com/library/';
                
                // ___TEST_SEQUENCE___.push(FETCH_LIB_PAGE);

                let pageText = await response.text();
                let libraryDocument = new DOMParser().parseFromString(pageText, 'text/html');

                TUTORIAL_SERIES = readSeriesFrom(libraryDocument);
                // ___TEST_SEQUENCE___.push(PARSE_LIB_PAGE);
                await GM.setValue(TUTORIAL_SERIES_KEY, TUTORIAL_SERIES);
                // ___TEST_SEQUENCE___.push(SAVE_TUTOR_DATA);
            }
        }

        // testSequence(___TEST_SEQUENCE___, SEQUENCE_1, 'Sequence 1');
        // testSequence(___TEST_SEQUENCE___, SEQUENCE_2, 'Sequence 2');

        // check if current page is a VIDEO page
        let seriesData = getTutorialSeriesData();
        if(seriesData != null){
            addButtons(seriesData);
        }

    })();

    // tests section start ---------

    // test await for get/set value
    async function testStorageOperations(){
        let before = await GM.getValue('test_set_value', 0);
        if(before != 0) throw 'Test for get default value is failed';
        await GM.setValue('test_set_value', 123);
        let after = await GM.getValue('test_set_value');
        if(after != 123) throw 'Test for getting value after setting is failed';
        await GM.deleteValue('test_set_value');
        let values = await GM.listValues();
        if(values.indexOf('test_set_value') != -1)  throw 'Test for deleting setting failed';

        // Doc is telling only simple types are supported
        // so we need to be sure if ARRAYS are also supported
        let src_arr = ['foo', 'bar'];
        await GM.setValue('my_arr', src_arr);
        let arr = await GM.getValue('my_arr');
        log('arr with NO json', arr);
        await GM.deleteValue('my_arr');
    };

    function testSequence(actualArr, expectedJoined, testName){
        if(actualArr.join() != expectedJoined){
            log(actualArr.join(), expectedJoined)
            throw `${testName} test FAILED`;
        } else {
            log(`${testName} test SUCCEDED`);
        }
    }

    // tests section end ---------
})();