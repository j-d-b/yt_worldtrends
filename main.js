// Jacob Brady
// April 2017

// YOUTUBE PLAYER API SETUP
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// GLOBALS
const API_KEY = "AIzaSyDmMfpYRWY9v0OLpJsN-HXlzdpHUdaoOXU";
const YT_LIGHTRED = "#E62117";
const YT_DARKRED = "#C51109";
const INIT_FILL_CLR = "#c1c1c1";
const SEL_FILL_COLOR = "#969696";
const BG_COLOR = "#f1f1f1";
const MAX_CHAR = 300;
const VALID_REGIONS = ["DZ","AR","AU","AT","AZ","BH","BY","BA","BR","BG","CA","CL","CO","HR","CZ","DK","EG","EE","FI","FR","GE","DE","GH","GR","HK","HU","IS","IN","ID","IQ","IE","IL","IT","JP","JO","KZ","KE","KW","LV","LB","LY","LT","LU","MK","MY","MX","ME","MA","NP","NL","NZ","NG","NO","OM","PK","PE","PH","PL","PR","QA","RO","RU","SA","SN","RS","SG","SK","SI","ZA","KR","ES","LK","SE","CH","TW","TZ","TH","TN","TR","UG","UA","AE","UK","US","VN","YE","ZW"];
var prev_player, full_player; // youtube player objects
var curr_vidlist = []; // saves the first five vid objs for the selected country
var vidlist_index = 0; // which video of the five is currently being shown
var curr_region; // which country is currently selected
var expanded = false; // is vid description expanded


// JQUERY!
$(document).ready(function(){
    $('#me_link').tooltip({title: "about me", trigger: 'hover', delay: {show: 400, hide: 0}});
    $('#github_link').tooltip({title: "github", trigger: 'hover', delay: {show: 400, hide: 0}});
    $('#mail_link').tooltip({title: "contact", trigger: 'hover', delay: {show: 400, hide: 0}});
    
    $('#settings').popover({
        html : true,
        content: function() {
            return $('#popover_content').html();
        }
    });

    $('.expand-collapse').click(function(){
        if(!expanded){
            $('#vid_desc').html(curr_vidlist[vidlist_index].snippet.description); // replace(/\n/g, "<br />"));
            expanded = true;
            $(".expand-collapse").removeClass("fa-caret-down");
            $(".expand-collapse").addClass("fa-caret-up");
        }
        else {$
            $('#vid_desc').html(curr_vidlist[vidlist_index].snippet.description.slice(0, MAX_CHAR) + "...");// .replace(/\n/g, "<br />"));
            expanded = false;
            $(".expand-collapse").removeClass("fa-caret-up");
            $(".expand-collapse").addClass("fa-caret-down");
        }
        $('#vid_desc').linkify({
            target: "_blank"
        });
    });

    // from SO.com, fix to two clicks to open popover bug + close on body click
    $(document).on('click', function (e) {
        $('[data-toggle="popover"],[data-original-title]').each(function () {
            //the 'is' for buttons that trigger popups
            //the 'has' for icons within a button that triggers a popup
            if (!$(this).is(e.target) && $(this).has(e.target).length === 0 && $('.popover').has(e.target).length === 0) {
                (($(this).popover('hide').data('bs.popover')||{}).inState||{}).click = false  // fix for BS 3.3.6
            }

        });
    });

    $("#left_button").click(function(){ // on modal open
        $('#video-modal').modal('toggle');
        switch_players(prev_player, full_player);
    });

    $("#video-modal").on('hidden.bs.modal', function (e) { // on modal close
        switch_players(full_player, prev_player);
    });

    $("#right_button").click(function(){
        vidlist_index += 1;
        if (vidlist_index >= 5) {
            vidlist_index = 0;
        }
        fill_info();
    });


    // SETUP MAP
    $(window).resize(function(){ // sizes the map in the bootstrap container
        var height = $(window).height(),
            offset = 175;
        $('#world-map').css('height', (height - offset));
    }).resize();

    $('#world-map').vectorMap({
        map: 'world_mill',
        backgroundColor: BG_COLOR,
        series: { // sets up/allows for coloring of selectable countries
            regions: [{
                attribute: 'fill'
            }]
        },
        regionStyle: {
            initial: {
                fill: INIT_FILL_CLR,
            },
            hover: {
                fill: YT_LIGHTRED,
                cursor: 'pointer'
            },
            selected: {
                fill: YT_LIGHTRED
            },
            selectedHover: {
                fill: YT_LIGHTRED,
                "fill-opacity": 1,
                cursor: 'pointer'
            }
        },
        zoomMax: 1,
        regionsSelectable: true,
        regionsSelectableOne: true, //add this line here
        zoomButtons : false,
        onRegionClick: function (event, region_code) {
            var valid = $.inArray(region_code, VALID_REGIONS);
            if (valid !== -1) {
                curr_region = region_code;
                req_vid(region_code);
            }
            else {
                event.preventDefault();
            }
        },
        onRegionOver: function(e, code) {
            var valid = $.inArray(code, VALID_REGIONS);
            if (valid == -1) {
                e.preventDefault();
            }
        },
        onRegionTipShow: function(e, el, code){
            // console.log(code);
            var valid = $.inArray(code, VALID_REGIONS);
            if (valid == -1) {
                e.preventDefault();
            }
        }
    });

    // darken the selectable countries
    var map = $('#world-map').vectorMap('get', 'mapObject');
    map.series.regions[0].setValues(color_regions(VALID_REGIONS, SEL_FILL_COLOR));

});

// this might be an inelegant method of doing this, but I don't know another way
function color_regions(regions, color_code){
    var colors = {};
    console.log(regions.length);
    for (var i = 0; i < regions.length; i++) {
        colors[regions[i]] = color_code;
    }
    return colors;
}

// given the region, gives a list of most popular in that region and returns
// a list of the first page of video objects from the JSON request
function req_vid(region_code) {
    var url = "https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=" + region_code + "&key=" + API_KEY;

    $.get(url, function(data) {
        update_vidobjs(data);
        fill_info();
    });

}

// takes the obj data from youtube request and extracts the first page of video
// objects from it, putting them in the curr_vidlist global
function update_vidobjs(data){
    curr_vidlist = [];
    vidlist_index = 0;
    var num_vids = data.pageInfo.resultsPerPage;
    for(var i = 0; i < num_vids; i++){
        curr_vidlist.push(data.items[i]);
    }
}

// updates the info in the main info-div box
function fill_info(){
    $("#info_footer").removeClass("hidden");

    // starts not expanded
    expanded = false;
    $(".expand-collapse").removeClass("fa-caret-up");
    $(".expand-collapse").addClass("fa-caret-down");

    var curr_vid = curr_vidlist[vidlist_index];
    var map = $('#world-map').vectorMap('get', 'mapObject');

    if (curr_vid.snippet.description.length < MAX_CHAR){
        $("#vid_desc").html(curr_vid.snippet.description);
        $(".expand-collapse").addClass("hidden");
    }
    else { // over the char limit
        $("#vid_desc").html(curr_vid.snippet.description.slice(0, MAX_CHAR) + "...");
        $(".expand-collapse").removeClass("hidden");
    }
    $('#vid_desc').linkify({ target: "_blank" }); // autohyperlink

    $("#prev_title").html(curr_vid.snippet.title);
    $("#vid_viewers").html(""); // current just clears opening text
    $("#vid_date").html(curr_vid.snippet.publishedAt.slice(0, 10));
    $("#counter_col").html("# " + (vidlist_index + 1).toString());
    $("#vid_author").html("by " + curr_vid.snippet.channelTitle);
    $("#region").html(map.getRegionName(curr_region));
    // put the iframes in place
    $("#prev_vid").html(iframe_gen(curr_vid.id, "ytplayer"));
    $("#video").html(iframe_gen(curr_vid.id, "ytplayer_modal"));

    init_player("ytplayer", "ytplayer_modal"); // setup player objects
}

// takes vid ID and embeds it into a bootstrap responsive iframe; uses 16x9
function iframe_gen(vid_id, id){
    var resp_iframe_html = "<div class='embed-responsive embed-responsive-16by9'><iframe class='embed-responsive-item' id="+ id + " src='https://www.youtube.com/embed/" + vid_id + "?enablejsapi=1' + allowfullscreen></iframe></div>";
    return resp_iframe_html;
}

// sets up the iframe players at the two given divs, with div1 used for the
// primary video, and div2 for the popup video.
function init_player(div_id1, div_id2){
    prev_player = new YT.Player(div_id1, {
        events: {
            onReady: function(e){
                e.target.playVideo();
            }
        }
    });
    full_player = new YT.Player(div_id2);
}

// takes two youtube player objects and switches from playing the video on
// the first to the second
function switch_players(switch_from, switch_to){
    if(switch_from.getPlayerState() == 1){ // is playing
        var timestamp = switch_from.getCurrentTime();
        switch_from.stopVideo();
        switch_to.seekTo(timestamp);
    }
    else { // fixes quick switch invoke before video loads
        switch_from.stopVideo();
    }
}

// NOT YET WORKING; CAN GET ADDITIONAL STATS
// function req_stats(vid_id) {
//     var url = "https://www.googleapis.com/youtube/v3/videos?part=statistics&id=" + vid_id + "&key=" + API_KEY;
//     var req_js_obj;
//
//     $.get(url, function(data) {
//         req_js_obj = data;
//     });
//
// }
