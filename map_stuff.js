// Jacob Brady
// April 2017

// YOUTUBE PLAYER API SETUP
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

// GLOBALS
const api_key = "AIzaSyDmMfpYRWY9v0OLpJsN-HXlzdpHUdaoOXU";
const yt_lightred = "#E62117"
const yt_darkred = "#C51109"
const desc_max_char = 300;

var prev_player, full_player; // youtube player objects
var curr_vidlist = []; // saves the first five vid objs for the selected country
var vidlist_index = 0; // which video of the five is currently being shown
var curr_region; // which country is currently selected
var expanded = false; // is vid description expanded


// JQUERY!
$(document).ready(function(){
    // BOOTSTRAP FUNCTIONS
    $('#settings').popover({
      html : true,
      content: function() {
        return $('#popover_content').html();
      }
    });

    $('[data-toggle="popover"]').popover({
        container: 'body'
    });

    $('[data-toggle="popover"]').popover();

    $('body').on('click', function (e) {  // CP'D. CLOSE POPOVER ON CLICK
        if ($(e.target).data('toggle') !== 'popover'
            && $(e.target).parents('.popover.in').length === 0) {
                $('[data-toggle="popover"]').popover('hide');
            }
    });

    $('#me_link').tooltip({title: "about me", trigger: 'hover', delay: {show: 400, hide: 0}});
    $('#github_link').tooltip({title: "github", trigger: 'hover', delay: {show: 400, hide: 0}});
    $('#mail_link').tooltip({title: "contact", trigger: 'hover', delay: {show: 400, hide: 0}});

    $(window).resize(function(){ // sizes the map in the bootstrap container
        var height = $(window).height(),
            offset = 175;
        $('#world-map').css('height', (height - offset));
    }).resize();

    $("#left_button").click(function(){ // on modal open
        $('#video-modal').modal('toggle');
        switch_players(prev_player, full_player);
    });

    $("#right_button").click(function(){
        vidlist_index += 1;
        if (vidlist_index >= 5) {
            vidlist_index = 0;
        }
        fill_info();
    });

    $("#video-modal").on('hidden.bs.modal', function (e) { // on modal close
        switch_players(full_player, prev_player);
    });

    $('#world-map').vectorMap({
        map: 'world_mill',
        backgroundColor: '#f1f1f1',
        regionStyle: {
            initial: {
                fill: '#969696',
                "fill-opacity": 1,
                stroke: 'none',
                "stroke-width": 0,
                "stroke-opacity": 1
            },
            hover: {
                fill: yt_lightred,
                "fill-opacity": 1,
                cursor: 'pointer'
            },
            selected: {
                fill: yt_lightred
            },
            selectedHover: {
            }
        },
        zoomMax: 5,
        regionsSelectable: true,
        regionsSelectableOne: true, //add this line here
        zoomButtons : false,
        onRegionClick: function (event, region_code) {
            curr_region = region_code;
            req_vid(region_code);
        }
    });

});


// given the region, gives a list of most popular in that region and returns
// a list of the first page of video objects from the JSON request
function req_vid(region_code) {
    var url = "https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=" + region_code + "&key=" + api_key;

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


function fill_info(){
    $("#info_footer").removeClass("hidden");

    var curr_vid = curr_vidlist[vidlist_index];
    var map = $('#world-map').vectorMap('get', 'mapObject');

    if (curr_vid.snippet.description.length < desc_max_char){
        document.getElementById("vid_desc").innerHTML = curr_vid.snippet.description;
    }
    else { // over the char limit
        $("#vid_desc").html(curr_vid.snippet.description.slice(0, desc_max_char) + " <a href='#' class='fa fa-ellipsis-h expand-collapse' aria-hidden='true'></a>");
        $('.expand-collapse').click(function(){
            if(!expanded){
                $('#vid_desc').html(curr_vid.snippet.description + " <a href='#' class='fa fa-ellipsis-v expand-collapse' id='collapse' aria-hidden='true'></a>");
            }
            else {
                $('#vid_desc').html(curr_vid.snippet.description.slice(0, desc_max_char) + " <a href='#' class='fa fa-ellipsis-h expand-collapse' aria-hidden='true'></a>");
            }
        });
    }

    $("#prev_title").html(curr_vid.snippet.title);
    $("#vid_viewers").html("");
    $("#vid_date").html(curr_vid.snippet.publishedAt.slice(0, 10));
    $("#counter_col").html("# " + (vidlist_index + 1).toString());
    $("#vid_author").html("by " + curr_vid.snippet.channelTitle);
    $("#region").html(map.getRegionName(curr_region));
    $("#prev_vid").html(iframe_gen(curr_vid.id, "ytplayer"));
    $("#video").html(iframe_gen(curr_vid.id, "ytplayer_modal"));
    
    init_player("ytplayer", "ytplayer_modal");
}


// removes all content from the righthand info box
function clear_info(){
    document.getElementById("vid_desc").innerHTML = "";
    document.getElementById("region").innerHTML = "";
    document.getElementById("video").innerHTML = "";
    document.getElementById("prev_vid").innerHTML = "";
    document.getElementById("vid_viewers").innerHTML = "";
    document.getElementById("overlay_button").innerHTML = "";
    document.getElementById("next_button").innerHTML = "";
    document.getElementById("vid_author").innerHTML = "";
    document.getElementById("vid_date").innerHTML = "";
}


// takes vid ID (could do w/ url if easier) and puts it into a bootstrap
// iframe responsive, uses 4x3, but could add as variable if needed
function iframe_gen(vid_id, id){
    var resp_iframe_html = "<div class='embed-responsive embed-responsive-16by9'><iframe class='embed-responsive-item' id="+ id + " src='https://www.youtube.com/embed/" + vid_id + "?enablejsapi=1' + allowfullscreen></iframe></div>";
    return resp_iframe_html;
}

function get_info(region){
    alert(region);
}

// NOT YET WORKING; SHOULD GET ADDITIONAL STATS
function req_stats(vid_id) {
    var url = "https://www.googleapis.com/youtube/v3/videos?part=statistics&id=" + vid_id + "&key=" + api_key;
    var req_js_obj;

    $.get(url, function(data) {
        req_js_obj = data;
    });

}

// sets up the iFrame players at the two given divs, with div1 used for the
// primary video, and div2 for the
function init_player(div_id1, div_id2){
    prev_player = new YT.Player(div_id1, {
        events: {
            onReady: ready_go
        }
    });
    full_player = new YT.Player(div_id2);

}


function ready_go(event){
    event.target.playVideo();
}


function switch_players(switch_from, switch_to){
    if(switch_from.getPlayerState() == 1){ // is playing
        var timestamp = switch_from.getCurrentTime();
        switch_from.stopVideo();
        switch_to.seekTo(timestamp);
    }
}
