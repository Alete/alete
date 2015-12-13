$(document).ready(function(){
    $('.activityFeed').imagesLoaded(function() {
        $('.activityFeed').isotope({
            itemSelector: '.post'
        });
    });
    $('.notes').on('click', function(){
        console.log('notes', $(this).parents('.post').data('id'));
        return false;
    });
    $('.reflow').on('click', function(){
        var id = $(this).parents('.post').data('id');
        console.log('attempting to reflow', id);
        $.post('/activity/reflow', { _id: id }, function(data){
            console.log('reflowed', data);
        });
        if($(this).hasClass('clicked')){
            $(this).removeClass('clicked');
        } else {
            $(this).addClass('clicked');
        }
        return false;
    });
    $('.heart').on('click', function(){
        var id = $(this).parents('.post').data('id');
        console.log('heart', id);
        $.post('/activity/heart', { _id: id }, function(data){
            console.log('heart posted', data);
        });
        if($(this).hasClass('clicked')){
            $(this).removeClass('clicked');
        } else {
            $(this).addClass('clicked');
        }
        return false;
    });

    var currentPage = 1;
    var nextPage = 2;
    var loadingNextPage = false;
    var noMorePages = false;
    function loadPages(){
        loadingNextPage = true;
        $.get('/?page=' + nextPage, function(data) {
            var posts = $('<div>').html(data).find('.activityFeed').children();
            if(posts.length > 0) {
                $('.activityFeed').append(posts);
                $(posts).hide().imagesLoaded(function() {
                    $(posts).fadeIn();
                    $('.activityFeed').isotope('insert', $(posts));
                    currentPage++;
                    nextPage++;
                    loadingNextPage = false;
                    if($(window).height() - $('.post').last().offset().top > 50){
                        loadPages();
                    }
                });
            } else {
                noMorePages = true;
            }
        });
    }

    $(window).on('scroll', function() {
        if(($(window).scrollTop() >= ($(document).height() - $(window).height() - $('.post').last().height() + 200)) && !loadingNextPage && !noMorePages){
            loadPages();
        }
    });
});
