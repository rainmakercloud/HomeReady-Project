jQuery(document).ready(function () {
    jQuery('body').on('click', '[data-ma-action]', function (e) {
        e.preventDefault();

        var $this = jQuery(this);
        var action = jQuery(this).data('ma-action');

        switch (action) {


          case 'sidebar-open':
                var target = $this.data('ma-target');
                var backdrop = '<div data-ma-action="sidebar-close" class="ma-backdrop" />';

                jQuery('body').addClass('sidebar-toggled');
                jQuery('#header, #header-alt, #main').append(backdrop);
                $this.addClass('toggled');
                jQuery(target).addClass('toggled');

                break;

            case 'sidebar-close':
                jQuery('body').removeClass('sidebar-toggled');
                jQuery('.ma-backdrop').remove();
                jQuery('.sidebar, .ma-trigger').removeClass('toggled')

                break;
            /*-------------------------------------------
                Login Window Switch
            ---------------------------------------------*/
            case 'login-switch':
                var loginblock = $this.data('ma-block');
                var loginParent = $this.closest('.lc-block');

                loginParent.removeClass('toggled');

                setTimeout(function(){
                    jQuery(loginblock).addClass('toggled');
                });

                break;

        }
    });
});
