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
});
