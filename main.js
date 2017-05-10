max_char// Jacob Brady
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
const SEL_FILL_CLR = "#909090";
const HVR_FILL_CLR = "#a85352";
const BG_COLOR = "#f1f1f1";
const MAP_DIV_BOT_PAD = 20; //px
const MIN_INF_DIV_WID = 265; //px related to bs md col usage in map/infdiv
const MIN_HDR_FTR_WID = 436; //px
const BS_MD_COLLAPSE = 991; //px when window width is <= this, map above inf
const VALID_REGIONS = ["DZ","AR","AU","AT","AZ","BH","BY","BE","BA","BR","BG","CA","CL","CO","HR","CZ","DK","EG","EE","FI","FR","GE","DE","GH","GR","HK","HU","IS","IN","ID","IQ","IE","IL","IT","JP","JO","KZ","KE","KW","LV","LB","LY","LT","LU","MK","MY","MX","ME","MA","NP","NL","NZ","NG","NO","OM","PK","PE","PH","PL","PT","PR","QA","RO","RU","SA","SN","RS","SG","SK","SI","ZA","KR","ES","LK","SE","CH","TW","TZ","TH","TN","TR","UG","UA","AE","GB","US","VN","YE","ZW"];
var curr_vidlist = []; // saves the first five vid objs for the selected country
var vidlist_index = 0; // which video of the five is currently being shown
var curr_region; // which country is currently selected
var expanded = false; // is vid description expanded
var auto_play = true;
var max_char;


// JQUERY!
$(document).ready(function(){
    max_char = $('#info-win').width();

    $('#video_load').bootstrapToggle({
        on: 'On',
        off: 'Off',
        size: 'mini',
        onstyle: 'danger'
    });

    $('#video_load').change(function() {
        if ($("#video_load").is(":checked")){
            auto_play = true;
        }
        else {
            auto_play = false;
        }
    });

    $('#me_link').tooltip({title: "about me", trigger: 'hover', delay: {show: 400, hide: 0}});
    $('#github_link').tooltip({title: "github", trigger: 'hover', delay: {show: 400, hide: 0}});
    $('#mail_link').tooltip({title: "contact", trigger: 'hover', delay: {show: 400, hide: 0}});

    $('#settings').tooltip({title: "help/settings", placement: 'left', trigger: 'hover', delay: {show: 400, hide: 0}});

    $('#load_box').tooltip({title: "enable/disable video autostart on region click", placement: 'right', trigger: 'hover', delay: {show: 300, hide: 0}});

    $('#settings').click(function(){ // on modal open
        $('#help-content').modal('toggle');
    });

    $('.expand-collapse').click(function(){
        if(!expanded){
            $('#vid_desc').html(curr_vidlist[vidlist_index].snippet.description);
            expanded = true;
            $(".expand-collapse").removeClass("fa-caret-down");
            $(".expand-collapse").addClass("fa-caret-up");
        }
        else {$
            $('#vid_desc').html(curr_vidlist[vidlist_index].snippet.description.slice(0, max_char) + "...");
            expanded = false;
            $(".expand-collapse").removeClass("fa-caret-up");
            $(".expand-collapse").addClass("fa-caret-down");
        }
        $('#vid_desc').linkify({
            target: "_blank"
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


    // MAP SETUP BELOW
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
                fill: HVR_FILL_CLR,
                "fill-opacity": 1,
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
        zoomMax: 5,
        zoomOnScroll: false,
        panOnDrag: false,
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
            var valid = $.inArray(code, VALID_REGIONS);
            if (valid == -1) {
                e.preventDefault();
            }
        }
    });

    size_map();

    // darken the selectable countries
    var map = $('#world-map').vectorMap('get', 'mapObject');
    map.series.regions[0].setValues(color_regions(VALID_REGIONS, SEL_FILL_CLR));

    // RESPONIVE TO RESIZE
    $(window).resize(function(){
        var height = $(window).height();
        var width = $(window).width();
        var offset = 175; // from footer
        var inf_hi = $('#info-div').height()

        size_map();

        max_char = $('#info-win').width();

        var inf_wid = $('#info-div').width()

        if(inf_wid < MIN_INF_DIV_WID){ // 264
            $('#counter_col').css("font-size", inf_wid / 16);
            $('.panel_button').css("font-size", inf_wid / 19.5);
        }
        else {
            $('#counter_col').css("font-size", 18);
            $('.panel_button').css("font-size", 14);
        }

        // trying to look decent on mobile, responsively...
        if (width < MIN_HDR_FTR_WID){
            $('#top_bar').css("padding-left", width / 20);
            $('#top_bar').css("font-size", width / 17.1);
        }
        else {
            $('#top_bar').css("padding-left", 25); // defaults, set in .css file
            $('#top_bar').css("font-size", 26);
        }
    }).resize();

});

// dyanmically size the map container
function size_map(){
    var height = $(window).height();
    var width = $(window).width();
    var offset = 175; // from footer
    var inf_hi = $('#info-div').height()

    if (width <= BS_MD_COLLAPSE) { // info div is below map
        $('#info-div').css('padding-top', 0);
        $('#map-div').css('margin-left', 0);
        $('#world-map').css('height', (height - offset - inf_hi));

        if(width <= 500) {
            $('#world-map').css('min-height', 200);
        }
        else {
            $('#world-map').css('min-height', 327);
        }
        $('#world-map').vectorMap('get','mapObject').updateSize();
    }
    else { // info and map side by side
        $('#world-map').css('min-height', 327);
        $('#info-div').css('padding-top', 40);
        $('#map-div').css('margin-left', 30);

        if( (height - offset) > 327){
            $('#world-map').css('height', (height - offset));
        }
        $('#world-map').vectorMap('get','mapObject').updateSize();

    }
}

// this might be an inelegant method of doing this, but I don't know another way
function color_regions(regions, color_code){
    var colors = {};
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

    if (curr_vid.snippet.description.length < max_char){
        $("#vid_desc").html(curr_vid.snippet.description);
        $(".expand-collapse").addClass("hidden");
    }
    else { // over the char limit
        $("#vid_desc").html(curr_vid.snippet.description.slice(0, max_char) + "...");
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
                if(auto_play){
                    e.target.playVideo();
                }
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
