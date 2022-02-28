const puppeteer = require("puppeteer")
const pdf = require("pdfkit");
const fs = require("fs");
let ctab;
let link = 'https://www.youtube.com/playlist?list=PLIs-4ytcUDi_ePXSBB1GX8wf5it5LpyLs';
(async function() {
    try {
        const browserOpen = await puppeteer.launch({
            headless: false,
            defaulViewport: null,
            args: ['--start-maximized']
        })


        let allTabs = await browserOpen.pages()
        ctab = allTabs[0];
        await ctab.goto(link)
        await ctab.waitForSelector('h1#title')
        let name = await ctab.evaluate(function(select) {
            return document.querySelector(select).innerText
        }, 'h1#title')
        console.log(name);
        let allData = await ctab.evaluate(getData, '#stats .style-scope.ytd-playlist-sidebar-primary-info-renderer')
        console.log(allData.noOfVideos, allData.noOfViews);
        let totalVideos = allData.noOfVideos.split(" ")[0];
        console.log(totalVideos);

        let Cvideos = await getCVideosLength()
            // console.log("len" + Cvideos);

        while (totalVideos - Cvideos > 1) {
            await scrollToBottom()
            Cvideos = await getCVideosLength()
                // console.log(Cvideos);
        }

        let finalList = await getStats();
        // console.log(finalList);
        // console.log(finalList.length);
        let pdfDoc = new pdf
        pdfDoc.pipe(fs.createWriteStream("play.pdf"));
        pdfDoc.text(JSON.stringify(finalList));
        pdfDoc.end();



    } catch (err) {
        console.log(err);
    }
})()

function getData(selector) {
    let allElems = document.querySelectorAll(selector);
    let noOfVideos = allElems[0].innerText;
    let noOfViews = allElems[1].innerText

    return {
        noOfVideos,
        noOfViews
    }
}

async function getCVideosLength() {
    let length = await ctab.evaluate(getLength, '#container>#thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer')
        // console.log("len3" + length);
    return length
}

async function getStats() {
    let list = await ctab.evaluate(getNameAndDuration, '#video-title', '#thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer')
        // console.log(list);
    return list
}

async function scrollToBottom() {
    await ctab.evaluate(goToBottom)

    function goToBottom() {
        window.scrollBy(0, window.innerHeight)
    }
}

function getLength(durationSelect) {
    console.log("..");
    let durationElem = document.querySelectorAll(durationSelect);
    return durationElem.length
}


function getNameAndDuration(videoSelector, durationSelector) {
    let videoElem = document.querySelectorAll(videoSelector);
    let durationElem = document.querySelectorAll(durationSelector)
        // console.log(videoElem[0]);
    let cList = []

    for (let i = 0; i < durationElem.length; i++) {
        let videoTitle = videoElem[i].innerText;
        let duration = durationElem[i].innerText;

        cList.push({ videoTitle, duration });
    }
    // cList.push("hello")
    // console.log(cList);
    return cList;
}