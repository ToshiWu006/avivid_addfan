(async function () {
    //// allowed in index, category, product_page and exclude balcklist
    AviviD.check_addfan_rules_sub = function (mode = 0) {
        // 0: check black rules, others: check allow rules
        var href = location.href.split('avivid')[0].slice(0); // remove avivid related search query
        href = href.slice(-1) === '?' || href.slice(-1) === '&' ? href.slice(0, -1) : href;
        var url_key = (mode == 0) ? ['login', 'cart', 'checkout'] : ['index', 'category', 'product'];
        var obj = (mode == 0) ? AviviD.blacklist['blacklist_rules'] : AviviD.block_setting;
        var status = (mode == 0) ? false : true;
        var enable = (mode == 0) ? AviviD.blacklist['blacklist_rules']['blacklist_switch'] == 1 : true;
        if (enable) {
            for (let i = 0; i < url_key.length; i++) {
                let event_key = obj[url_key[i]];
                let force_domain = (event_key !== undefined) ? event_key['force_domain'] : false;
                if (force_domain == 1) {
                    //// check domain_list (fully match)
                    let domain_list = event_key['domain_list'];
                    if (domain_list.includes(href)) {
                        return status; // early return
                    };
                } else if (force_domain == 0) {
                    //// check blacklist rule (partially match)
                    let check_rule = event_key['check_rule']; // str
                    if (href.toLowerCase().includes(check_rule.toLowerCase())) {
                        return status; // early return
                    };
                };
            };
        };
    };

    AviviD.check_addfan_rules = function () {
        //// check black_list first
        var c0 = AviviD.check_addfan_rules_sub(0);
        if (c0 !== undefined) {
            return c0; // early return false
        };
        //// check order, cart to block, match with pathname
        var pathname = location.pathname;
        var block_regex = 'login|account|shopping|cart|pay|checkout|check|order|finish|bus';
        var res = pathname.search(new RegExp(block_regex, 'i')); // str or undefined
        if (res !== -1) {
            console.log('block this url');
            return false;
        };
        //// check allowed rules
        var c1 = AviviD.check_addfan_rules_sub(1);
        if (c1 !== undefined) {
            return c1;
        };
        return false;
    };

    //// should be loaded after event_tracker_gtm.js
    //// Rules in https://docs.google.com/document/d/1YFZf0DYqI1XHuRM8teZx5wy_fcAoWfPplVJjUXGb--U/edit?usp=sharing
    //// API to give the highest prioity coupon
    AviviD.fetch_coupon_status = async function (web_id) {
        return new Promise((resolve, reject) => {
            let url = 'https://rhea-cache.advividnetwork.com/api/coupon/status'; // https://rhea-cache.advividnetwork.com/api/
            jQuery.ajax({
                type: 'GET',
                url: url,
                cache: true,
                dataType: 'json',
                data: {
                    'web_id': web_id
                },
                success: function (result) {
                    resolve(result)
                },
                fail: function (xhr, ajaxOptions, thrownError) {
                    reject(false)
                },
            })
        })
    };

    //// API to give the all coupons
    AviviD.fetch_coupon_status_all = async function (web_id) {
        return new Promise((resolve, reject) => {
            let url = 'https://rhea-cache.advividnetwork.com/api/coupon/status_all'; // https://rhea-cache.advividnetwork.com/api/
            jQuery.ajax({
                type: 'GET',
                url: url,
                cache: true,
                dataType: 'json',
                data: {
                    'web_id': web_id
                    // 'web_id': 'rick'
                },
                success: function (result) {
                    // resolve(result)
                    var result_modify = []
                    for (i = 0; i < result.length; i++) {
                        let coupon_limit = result[i]['coupon_limit'].split('limit-bill=')[1];
                        result[i]['coupon_limit'] = coupon_limit === undefined ? 0 : parseInt(coupon_limit);
                        result[i]['avg_budget'] = parseFloat(result[i]['avg_budget']);
                        result_modify.push(result[i]);
                    }
                    resolve(result_modify)
                },
                fail: function (xhr, ajaxOptions, thrownError) {
                    reject(false)
                },
            })
        })
    };

    //// API to give model for sending coupon
    AviviD.fetch_addFan_coupon_model = async function (web_id, coupon_id) {
        return new Promise((resolve, reject) => {
            let url = 'https://rhea-cache.advividnetwork.com/api/coupon/model'; // https://rhea-cache.advividnetwork.com/api/
            jQuery.ajax({
                type: 'GET',
                url: url,
                cache: true,
                dataType: 'json',
                data: {
                    'web_id': web_id,
                    'coupon_id': coupon_id
                },
                success: function (result) {
                    resolve(result)
                },
                fail: function (xhr, ajaxOptions, thrownError) {
                    reject(false)
                },
            })
        })
    };

    //// API to give coupon details (use coupon id)
    AviviD.fetch_addFan_coupon_detials = async function (coupon_id) {
        return new Promise((resolve, reject) => {
            let url = 'https://rhea-cache.advividnetwork.com/api/coupon/details'; // https://rhea-cache.advividnetwork.com/api/
            jQuery.ajax({
                type: 'GET',
                url: url,
                cache: true,
                dataType: 'json',
                data: {
                    'coupon_id': coupon_id
                },
                success: function (result) {
                    resolve(result)
                },
                fail: function (xhr, ajaxOptions, thrownError) {
                    reject(false)
                },
            });
        });
    };

    //// API to give not repeating batch coupon details (use coupon id)
    AviviD.fetch_addFan_batch_coupon_detials = async function (coupon_id) {
        return new Promise((resolve, reject) => {
            let url = 'https://rhea-cache.advividnetwork.com/api/coupon/details'; // https://rhea-cache.advividnetwork.com/api/
            jQuery.ajax({
                type: 'GET',
                url: url,
                cache: false,
                dataType: 'json',
                data: {
                    'coupon_id': coupon_id
                },
                success: function (result) {
                    resolve(result['coupon_code'])
                },
                fail: function (xhr, ajaxOptions, thrownError) {
                    reject(false)
                },
            });
        });
    };

    //// API to give update coupon is_send status (use coupon id and coupon code)
    AviviD.update_addFan_coupon_is_send = async function (link_code, coupon_code) {
        return new Promise((resolve, reject) => {
            let url = 'https://rhea-cache.advividnetwork.com/api/coupon/batchStatus'; // https://rhea-cache.advividnetwork.com/api/
            jQuery.ajax({
                type: 'POST',
                url: url,
                cache: true,
                dataType: 'json',
                data: {
                    'link_code': link_code,
                    'coupon_code': coupon_code,
                },
                success: function (result) {
                    resolve(result)
                },
                fail: function (xhr, ajaxOptions, thrownError) {
                    reject(false)
                },
            });
        });
    };

    //// API get customer is regular or vip or not
    AviviD.fetch_regular_vip = async function (web_id, uuid) {
        return new Promise((resolve, reject) => {
            let url = 'https://asia-east1-hd-crescent.cloudfunctions.net/get_regular_vip'; // https://rhea-cache.advividnetwork.com/api/
            jQuery.ajax({
                type: 'GET',
                url: url,
                cache: true,
                dataType: 'json',
                data: {
                    'web_id': web_id,
                    'uuid': uuid,
                },
                success: function (result) {
                    var result_modify = (result['message'] === 'Succeed.') ? {
                        'regular': parseInt(result['regular']),
                        'vip': parseInt(result['vip'])
                    } : {
                        'regular': 0,
                        'vip': 0
                    };
                    resolve(result_modify)
                },
                fail: function (xhr, ajaxOptions, thrownError) {
                    reject(false)
                },
            });
        });
    };


    //// API convert product id to product name and url
    AviviD.fetch_name_url_from_id = async function (web_id, product_id) {
        return new Promise((resolve, reject) => {
            let url = 'https://rhea-cache.advividnetwork.com/api/coupon/get_name_url'; // https://rhea-cache.advividnetwork.com/api/
            jQuery.ajax({
                type: 'GET',
                url: url,
                cache: true,
                dataType: 'json',
                data: {
                    'web_id': web_id,
                    'product_id': product_id,
                },
                success: function (result) {
                    resolve(result)
                },
                fail: function (xhr, ajaxOptions, thrownError) {
                    reject(false)
                },
            });
        });
    };

    //// API convert id to product name and url (footprint)
    AviviD.fetch_name_url_from_footprint = async function (web_id, id) {
        return new Promise((resolve, reject) => {
            let url = 'https://rhea-cache.advividnetwork.com/api/coupon/get_name_url_id'; // https://rhea-cache.advividnetwork.com/api/
            jQuery.ajax({
                type: 'GET',
                url: url,
                cache: true,
                dataType: 'json',
                data: {
                    'web_id': web_id,
                    'data': id,
                },
                success: function (result) {
                    resolve(result)
                },
                fail: function (xhr, ajaxOptions, thrownError) {
                    reject(false)
                },
            });
        });
    };

    //// API get items on sale from DPA
    AviviD.fetch_sale_items = async function (web_id) {
        return new Promise((resolve, reject) => {
            let url = 'https://rhea-cache.advividnetwork.com/api/coupon/get_sale_item'; // https://rhea-cache.advividnetwork.com/api/
            jQuery.ajax({
                type: 'GET',
                url: url,
                cache: true,
                dataType: 'json',
                data: {
                    'web_id': web_id,
                },
                success: function (result) {
                    resolve(result)
                },
                fail: function (xhr, ajaxOptions, thrownError) {
                    reject(false)
                },
            });
        });
    };

    //// API get hot items 
    AviviD.fetch_hot_items = async function (web_id) {
        return new Promise((resolve, reject) => {
            let url = 'https://rhea-cache.advividnetwork.com/api/productEcom'; // https://rhea-cache.advividnetwork.com/api/
            jQuery.ajax({
                type: 'GET',
                url: url,
                cache: true,
                dataType: 'json',
                data: {
                    'web_id': web_id,
                    'title': 'default',
                    'type': 'hot',
                },
                success: function (result) {
                    var result_modify = []
                    for (i = 0; i < result.length; i++) {
                        if (i === 10) {
                            break;
                        };
                        result_modify.push({
                            'name': result[i]['title'],
                            'url': result[i]['url']
                        });
                    }
                    resolve(result_modify)
                },
                error: function (result) {
                    resolve({
                        'name': '_',
                        'url': '_'
                    })
                },
                fail: function (xhr, ajaxOptions, thrownError) {
                    reject(false)
                },
            });
        });
    };

    AviviD.LikrEventTrackingSendCoupon = function () {
        let ga_id = (AviviD.get_cookie_tracking('_ga') != "NaN") ? AviviD.get_cookie_tracking('_ga') : AviviD.get_cookie_tracking('gaClientId');
        let uuid = AviviD.get_cookie_tracking('AviviD_uuid');
        let fb_id = AviviD.get_cookie_tracking('_fbp');
        let ip = (AviviD.clientIP === undefined) ? "_" : AviviD.clientIP;
        let is_coupon = (AviviD.get_cookie_tracking('AviviD_is_coupon') !== "NaN") ? AviviD.get_cookie_tracking('AviviD_is_coupon') : 0;
        let coupon_info = {
            "p_p": AviviD.addFan.AviviD_prob_p,
            "l_b": AviviD.addFan.lower_bound,
            "u_b": AviviD.addFan.upper_bound,
            "m_k": AviviD.addFan.model_keys,
            "m_p": AviviD.addFan.model_parameters,
            "m_i": AviviD.addFan.model_intercept,
            "m_X": AviviD.addFan.model_X,
            "c_i": AviviD.addFan.coupon_id,
            "c_c_t": AviviD.addFan.coupon_customer_type,
            "w_t": AviviD.addFan.website_type,

        };
        let tracking_data = {
            'web_id': AviviD.web_id,
            'uuid': uuid,
            'ga_id': ga_id,
            'fb_id': fb_id,
            'ip': ip,
            'timestamp': Date.now(),
            "behavior_type": "likrTracking",
            'event_type': "sendCoupon",
            "coupon": is_coupon,
            'record_user': AviviD.record_user,
            "coupon_info": coupon_info,
        };
        //// don't send if in preview mode
        if (AviviD.get_urlparam('avivid_preview_coupon') != 1) {
            AviviD.tracking_data_aws_put.construct(tracking_data);
            console.log("trigger sendCoupon event");
        };
    };

    AviviD.LikrEventTrackingAcceptCoupon = function (is_exit = false) {
        let ga_id = (AviviD.get_cookie_tracking('_ga') != "NaN") ? AviviD.get_cookie_tracking('_ga') : AviviD.get_cookie_tracking('gaClientId');
        let uuid = AviviD.get_cookie_tracking('AviviD_uuid');
        let fb_id = AviviD.get_cookie_tracking('_fbp');
        let ip = (AviviD.clientIP === undefined) ? "_" : AviviD.clientIP;
        let is_coupon = (AviviD.get_cookie_tracking('AviviD_is_coupon') !== "NaN") ? AviviD.get_cookie_tracking('AviviD_is_coupon') : 0;
        if (is_exit) {
            var coupon_info = {
                "p_p": AviviD.addFan.AviviD_prob_p,
                "c_t": AviviD.addFan.coupon_title_exit,
                "c_d": AviviD.addFan.coupon_description_exit,
                "c_c": AviviD.addFan.coupon_code_exit,
                "c_st": AviviD.addFan.coupon_setTimer_exit,
                "c_ty": AviviD.addFan.coupon_type_exit,
                "c_a": AviviD.addFan.coupon_amount_exit,
                "c_c_t": AviviD.addFan.coupon_customer_type_exit,
                "c_c_m": AviviD.addFan.coupon_code_mode_exit,
                "l_c": AviviD.addFan.link_code_exit,
                "c_i": AviviD.addFan.coupon_id_exit,
                "w_t": -1,
            };
        } else {
            var coupon_info = {
                "p_p": AviviD.addFan.AviviD_prob_p,
                "c_t": AviviD.addFan.coupon_title,
                "c_d": AviviD.addFan.coupon_description,
                "c_c": AviviD.addFan.coupon_code,
                "c_st": AviviD.addFan.coupon_setTimer,
                "c_ty": AviviD.addFan.coupon_type,
                "c_a": AviviD.addFan.coupon_amount,
                "c_c_t": AviviD.addFan.coupon_customer_type,
                "c_c_m": AviviD.addFan.coupon_code_mode,
                "l_c": AviviD.addFan.link_code,
                "c_i": AviviD.addFan.coupon_id,
                "w_t": AviviD.addFan.website_type,
            };
        };
        let tracking_data = {
            'web_id': AviviD.web_id,
            'uuid': uuid,
            'ga_id': ga_id,
            'fb_id': fb_id,
            'ip': ip,
            'timestamp': Date.now(),
            "behavior_type": "likrTracking",
            'event_type': "acceptCoupon",
            "coupon": is_coupon,
            'record_user': AviviD.record_user,
            "coupon_info": coupon_info,
        };
        //// don't send if in preview mode
        if (AviviD.get_urlparam('avivid_preview_coupon') != 1) {
            // console.log(tracking_data);
            AviviD.tracking_data_aws_put.construct(tracking_data);
            console.log("trigger acceptCoupon event");
        };
    };

    AviviD.LikrEventTrackingDiscardCoupon = function (is_exit = false) {
        let ga_id = (AviviD.get_cookie_tracking('_ga') != "NaN") ? AviviD.get_cookie_tracking('_ga') : AviviD.get_cookie_tracking('gaClientId');
        let uuid = AviviD.get_cookie_tracking('AviviD_uuid');
        let fb_id = AviviD.get_cookie_tracking('_fbp');
        let ip = (AviviD.clientIP === undefined) ? "_" : AviviD.clientIP;
        let is_coupon = (AviviD.get_cookie_tracking('AviviD_is_coupon') !== "NaN") ? AviviD.get_cookie_tracking('AviviD_is_coupon') : 0;
        if (is_exit) {
            var coupon_info = {
                "p_p": AviviD.addFan.AviviD_prob_p,
                "c_t": AviviD.addFan.coupon_title_exit,
                "c_d": AviviD.addFan.coupon_description_exit,
                "c_c": AviviD.addFan.coupon_code_exit,
                "c_st": AviviD.addFan.coupon_setTimer_exit,
                "c_ty": AviviD.addFan.coupon_type_exit,
                "c_a": AviviD.addFan.coupon_amount_exit,
                "c_c_t": AviviD.addFan.coupon_customer_type_exit,
                "c_c_m": AviviD.addFan.coupon_code_mode_exit,
                "l_c": AviviD.addFan.link_code_exit,
                "c_i": AviviD.addFan.coupon_id_exit,
                "w_t": -1,
            };
        } else {
            var coupon_info = {
                "p_p": AviviD.addFan.AviviD_prob_p,
                "c_t": AviviD.addFan.coupon_title,
                "c_d": AviviD.addFan.coupon_description,
                "c_c": AviviD.addFan.coupon_code,
                "c_st": AviviD.addFan.coupon_setTimer,
                "c_ty": AviviD.addFan.coupon_type,
                "c_a": AviviD.addFan.coupon_amount,
                "c_c_t": AviviD.addFan.coupon_customer_type,
                "c_c_m": AviviD.addFan.coupon_code_mode,
                "l_c": AviviD.addFan.link_code,
                "c_i": AviviD.addFan.coupon_id,
                "w_t": AviviD.addFan.website_type,
            };
        };
        let tracking_data = {
            'web_id': AviviD.web_id,
            'uuid': uuid,
            'ga_id': ga_id,
            'fb_id': fb_id,
            'ip': ip,
            'timestamp': Date.now(),
            "behavior_type": "likrTracking",
            'event_type': "discardCoupon",
            "coupon": is_coupon,
            'record_user': AviviD.record_user,
            "coupon_info": coupon_info,
        };
        //// don't send if in preview mode
        if (AviviD.get_urlparam('avivid_preview_coupon') != 1) {
            AviviD.tracking_data_aws_put.construct(tracking_data);
            console.log("trigger discardCoupon event");
        };
    };

    //// send event, AviviD.gtm_event_send('bubble', 'likr', location.href)      
    AviviD.gtm_event_send_st = function (event_name, event_category, event_label) {
        if (AviviD.config_tracking.ga_id != '') {
            AviviD.event_ga_id = AviviD.config_tracking.ga_id;
        } else {
            return false;
        };
        var has_gtm = typeof (gtag) == "undefined" ? 0 : 1;
        if (has_gtm == 1) {
            try {
                if ("event_ga_id" in AviviD) {
                    gtag("config", AviviD.event_ga_id);
                };
                gtag("event",
                    event_name, {
                    "event_category": event_category,
                    "event_label": event_label,
                    "nonInteraction": true
                });
            } catch (e) {
                AviviD.console_logs(e);
            };
        } else {
            try {
                if ("event_ga_id" in AviviD) {
                    ga('create', AviviD.event_ga_id, 'auto');
                };
                ga("send", {
                    hitType: "event",
                    eventCategory: event_category,
                    eventAction: event_name,
                    eventLabel: event_label,
                    nonInteraction: true
                });
            } catch (e) {
                AviviD.console_logs(e);
            };
        };
    };

    //// click to clipboard message
    AviviD.clickToClipboard_info = function () {
        let coupon_copy_message = '您的折價卷代碼已複製到剪貼簿';
        let coupon_copy_message_css =
            `<style>
            .avivid_copy_message{
                position: fixed;
                width: 70vw;
                height: 6vw;
                line-height: 7vw;
                font-weight: 1000;
                font-size: 15px;
                color: #FFFFFF;
                top: 160vw;
                left: 15vw;
                text-align: center;
                display: none;
                z-index: 2147483642;
            }
        </style>`;
        let coupon_copy_message_div = `<div class='avivid_copy_message'>` + coupon_copy_message + `</div>`;
        jQuery('head').append(coupon_copy_message_css);
        jQuery('body').append(coupon_copy_message_div);
    };
    AviviD.clickToClipboard_info();

    AviviD.appendCouponLimit = function (coupon_limit) {
        var alert_div_1 = `<span>．折扣碼每人限領一次</span>`
        var alert_div_2 = `<span>．每筆訂單限使用一組折扣碼</span>`
        var alert_div_3 = `<span>．若有訂單退貨，優惠金額將一併扣除，不予退款</span>`
        var alert_div_4 = `<span style="font-weight:bold;">．最低金額消費需達到`
        var coupon_limit_array = coupon_limit.split(',');
        for (let i = 0; i < coupon_limit_array.length; i++) {
            let limit = coupon_limit_array[i];
            if (limit === 'limit-account') {
                jQuery('.avivid_coupon_alert').append(alert_div_1)
            } else if (limit === 'limit-order') {
                jQuery('.avivid_coupon_alert').append(alert_div_2);
            } else if (limit === 'limit-return') {
                jQuery('.avivid_coupon_alert').append(alert_div_3);
            } else if (limit.includes('limit-bill')) {
                let limit_bill = limit.split('=')[1];
                alert_div_4 += limit_bill + `元</span>`;
                jQuery('.avivid_coupon_alert').append(alert_div_4);
            };
        };
    };

    // Fisher-Yates Shuffle
    AviviD.shuffle = function (array) {
        for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        };
    };

    //// only for promotion coupon
    AviviD.update_couponUI = async function (is_exit = false, timeset = 30) {
        if (is_exit) {
            var limit_price = AviviD.addFan.coupon_limit_exit.split('limit-bill=')[1] === undefined ? 0 : parseInt(AviviD.addFan.coupon_limit_exit.split('limit-bill=')[1]);
            var coupon_description = AviviD.addFan.coupon_description_exit;
            var promotion_items = AviviD.addFan.promotion_items_exit;
        } else {
            var limit_price = AviviD.addFan.coupon_limit.split('limit-bill=')[1] === undefined ? 0 : parseInt(AviviD.addFan.coupon_limit.split('limit-bill=')[1]);
            var coupon_description = AviviD.addFan.coupon_description;
            var promotion_items = AviviD.addFan.promotion_items;
        }
        var foot_print = AviviD.get_cookie_tracking('AviviD_footprint');
        var product_name = '_';
        // console.log('couponUI');
        if (AviviD.tracking_addCart_parser['product_price'] !== undefined) {
            // 1) get item from cart
            // var limit_price = AviviD.addFan.coupon_limit.split('limit-bill=')[1]===undefined ? 0 : parseInt(AviviD.addFan.coupon_limit.split('limit-bill=')[1]);
            var cart_price = (AviviD.get_cookie_tracking('AviviD_cart_price') !== "NaN") ? parseInt(AviviD.get_cookie_tracking('AviviD_cart_price')) : 0;
            // var cart_product = AviviD.get_cookie_tracking("AviviD_cart_product") == 'NaN' ? 'NaN': AviviD.get_cookie_tracking("AviviD_cart_product");
            var cart_id = AviviD.get_cookie_tracking("AviviD_cart_id") == 'NaN' ? 'NaN' : AviviD.get_cookie_tracking("AviviD_cart_id").split(',');
            AviviD.shuffle(cart_id);
            if (cart_id !== 'NaN') {
                for (let i = 0; i < cart_id.length; i++) {
                    var result = await AviviD.fetch_name_url_from_id(AviviD.web_id, cart_id[i]);
                    if (result['name'] !== "_") {
                        var product_name = result['name'];
                        var product_url = result['url'];
                        break;
                    };
                };
            };
            if ((limit_price - cart_price) > 0) {
                AviviD.addFan.limitReach = 0;
                jQuery('#count-down-price').html(`<span style="color:white;">您還差$` + (limit_price - cart_price) + `可以使用此優惠券</span>`);
            } else {
                AviviD.addFan.limitReach = 1; // set customer
                jQuery('#count-down-price').empty();
            };
        };
        if (product_name === '_' && AviviD.addFan.promotion_items.length !== 0) {
            // 2) get from promotion items
            AviviD.shuffle(promotion_items);
            var product_name = promotion_items[0]['name'];
            var product_url = promotion_items[0]['url'];
        };
        if (product_name === '_') {
            // 3) get from sale items on DPA
            var sale_items = await AviviD.fetch_sale_items(AviviD.web_id);
            if (sale_items[0]["name"] !== "_") {
                AviviD.shuffle(sale_items);
                var product_name = sale_items[0]['title'];
                var product_url = sale_items[0]['url'];
            };
        };
        if (product_name === '_' && foot_print !== "NaN") {
            // 4) get from footprint
            var foot_print_id = decodeURIComponent(foot_print.replace(/\[/g, '').replace(/\]/g, '')).split(',');
            AviviD.shuffle(foot_print_id);
            for (let i = 0; i < foot_print_id.length; i++) {
                var result = await AviviD.fetch_name_url_from_footprint(AviviD.web_id, foot_print_id[i]);
                if (result['name'] !== "_") {
                    var product_name = result['name'];
                    var product_url = result['url'];
                    break;
                };
            };
        };
        if (product_name === '_') {
            // 5) get from hot items
            var hot_items = await AviviD.fetch_hot_items(AviviD.web_id);
            AviviD.shuffle(hot_items);
            var product_name = hot_items[0]['name'];
            var product_url = hot_items[0]['url'];
        }
        if (product_name.length > 8) {
            product_name = product_name.slice(0, 8) + '...';
        };
        if (product_name !== '_') {
            if (AviviD.addFan.check_cart_coupon) {
                jQuery('.avivid_coupon_title').text('您的購物車商品限時優惠中！')
                jQuery('.avivid_coupon_title').css("font-size", "26px");
            }
            var product_div = `<a class=avivid_coupon_title_product href="` + product_url + `?avivid_triggered_coupon=1" onclick="AviviD.AcceptCoupon(true, is_exit=` + is_exit + `)"><div>` + product_name + `限時優惠</div></a>`;
            var time_limit_div = `<div id="time-limit-text">(` + timeset + ` mins)</div>`;
            //// promotion coupon
            jQuery('#time-limit-text').remove();
            jQuery('.avivid_coupon_title').append(product_div);
            jQuery('.avivid_coupon_description').text(coupon_description);
            if (timeset !== 0) {
                jQuery('.avivid_coupon_title').append(time_limit_div);
            };
        };
    };

    //// load main for coupon
    AviviD.Promotion_coupons = function (title, content, code, timeset, limit, mode = 0, is_exit = false) {
        var coupon_css =
            `<style>
        @media (orientation:portrait) {
            .avivid_main_page{
                background-color: rgb(0, 0, 0,0.8);
                min-width: 100%;
                height: 100vh;
                height: -webkit-fill-available;
                position: fixed;
                top: 0;
                bottom: 0;
                z-index: 2147483641;
                overflow: auto;
                // display: none;
            }
            .coupon_position{
                position: relative;
                margin: auto;
                text-align: center;
                min-height: 100vh;
                display: flex;
                align-items: center;
                flex-direction: column;
                justify-content: start;
            }
            .text_background{
                border-bottom-left-radius: 50px;
                border-bottom-right-radius: 50px;
                width: 73.3%;
                position: absolute;
                left: 13.2%;
                top: 35%;
                text-align: center;
                z-index: 0;
            }
            .photo1{
                width: 90%;
                height: 43%;
                z-index: 1;
            }
            .photo2{
                position: absolute;
                top: 52%;
                left: 10%;
                background-position: center center;
                width: 78%;
                height: 36%;
                z-index: 2;
            }
            .coupon_backgroud{
                width: 90%;
            }
            #secondary_page{
                position: fixed;
                top: 75vh;
                border: 1px solid rgb(0, 0, 0,0.6);
                width: 35vw;
                background-color: rgb(0, 0, 0,0.6);
                left: 3%;
                border-radius: 13px;
                display:none;
                z-index: 999;
                padding-top: 4vw;
                padding-bottom: 4vw;
            }
            #secondary_reciprocal{
                display: flex;
                justify-content: center;
            }
            #secondary_reciprocal [class*="col-"] {
                float: left;
                padding-right: 6%;
                padding-top:10%;
            }
            #secondary_reciprocal .col-1 {
                width: 1%;
                border:2px solid white;
            }
            #secondary_reciprocal  .col-2 {
                width: 1%;
                border:1px solid white;
            }
            .avivid-bar-icon{
                padding-right: 6% !important;
                padding-left: 0 !important;
                flex: 0 !important;
            }
            @keyframes fade {
                from {
                    opacity: 0.1;
                }
                50% {
                    opacity: 1.5;
                }
                to {
                    opacity: 1.5;
                }
            }
            @-webkit-keyframes fade {
                from {
                    opacity: 0.1;
                }
                50% {
                    opacity: 1.5;
                }
                to {
                    opacity: 1.5;
                }
            }
            .blink {
                background-color: red;
                animation: fade 600ms infinite;
                -webkit-animation: fade 3s infinite;
            }
            #gif{
                animation-play-state: paused;
                -webkit-animation: fade 5s infinite;
            }
            .avivid_coupon_cap{
                background: url('https://rhea-cache.advividnetwork.com/coupon/img/mobile_coupon_cap.png');
                background-repeat: no-repeat;
                height: 144px;
                background-size:100%;
                width: 80.7vw;
                max-width:278px;
                background-position: top center;
            }
            .avivid_coupon_content_wraper{
                display: flex;
                flex-direction: column;
                align-items: center;
                background: #fff;
                width: 80.7vw;
                max-width:278px;
                margin-left: 0.5vw;
                padding: 0 2vw 20px 2vw;
                border-radius: 0 0 30px 30px;
                box-shadow: 0px 0px 10px 0px rgb(255 255 255 / 50%);
                box-sizing: border-box;
                position: relative;
                top: -1px;
            }
            .avivid_coupon_title{             
                font-family: Noto sans;
                font-style: normal;
                font-weight: Bold;
                font-size: 16px;
                line-height: 140%;
                letter-spacing:1px;
                /* or 130% */
                text-align: center;
                color: #F78CA0;
            }
            .avivid_coupon_title_product{             
                font-family: Noto sans;
                font-style: normal;
                font-weight: 1000;
                font-size: 20px;
                line-height: 26px;
                /* or 130% */
                text-align: center;
                color: #F78CA0;
            }
            @media only screen and (max-width: 400px) {
                .avivid_coupon_title  {
                    font-size: 16px;
                    letter-spacing:1px;
                }
            }
            @media only screen and (max-width: 350px) {
                .avivid_coupon_title  {
                    font-size: 16px;
                }
            }
            .avivid_coupon_description{
                font-family: Noto sans;
                font-style: normal;
                font-weight: Regular;
                font-size: 30px;
                line-height: 140%;
                letter-spacing:0px;
                /* or 140% */
                text-align: center;
                color: #606060;
                margin: 16px 0 0 0; 
                display: -webkit-box;
                -webkit-line-clamp: 6;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: pre-line;
            }
            @media only screen and (max-width: 400px) {
                .avivid_coupon_description  {
                    font-size: 30px;
                }
            }
            .avivid_coupon_description_locked{
                font-size: 17px;
                margin: 40px 0;
            }
            .avivid_coupon{         
                font-family: Noto sans;
                font-style: normal;
                font-weight: normal;
                font-size: 15px;
                line-height: 15px;
                text-align: center;                
                color: #606060;           
                /* margin-top: 2vh; */
            }
            .avivid_coupon_code{       
                font-family: Noto sans;
                font-style: normal;
                font-weight: Bold;
                font-size: 24px;
                line-height: 140%;
                letter-spacing:2px;
                text-align: center;           
                color: #606060;            
                margin:24px 0;
            }
            .avivid_coupon_help{
                font-family: Noto sans;
                font-style: normal;
                font-weight: 300;
                font-size: 10px;
                line-height: 140%;
                /* identical to box height, or 160% */
                text-align: center;      
                color: #606060;
                margin: 1vh 0;
            }
            @media only screen and (max-width: 400px) {
                .avivid_coupon{
                }
                .avivid_coupon_code{
                    font-size:24px;
                }
                .avivid_coupon_help{
                }
            }
            .avivid_coupon_sep{
                width: 100%;
                height: 0px;
                border: 1px dashed #606060;
                margin: 5px 0;
            }
            .avivid_coupon_alert{
                font-family: Noto sans;
                font-style: normal;
                font-weight: 300;
                font-size: 10px;
                line-height: 140%;
                /* or 175% */
                text-align: center;
                color: #606060;
                margin: 1vh 0;
            }
            .avivid_coupon_discard{
                width: 17vw;
            }
            .avivid_coupon_accept{
                width: 44vw;
            }
            .avivid_coupon_exit{
                position: absolute;
                width: 12vw;
                left: 32vw;
                top: -3vw;
            }
            .hidden{
                display: none;
            }

            @media (min-width: 700px) {
                .avivid_coupon_cap{
                    background: url('https://rhea-cache.advividnetwork.com/coupon/img/pc_coupon_cap.png');
                    filter: drop-shadow(-1px -1px 9px rgba(0, 0, 0, 0.7));
                    max-width:416px;
                    background-size: 100%;
                    height: 260px;
                }

                .avivid_coupon_content_wraper{
                    box-shadow: 2px 8px 7px 2px rgb(0 0 0 / 30%), 0 6px 6px 0 rgb(0 0 0 / 19%);
                    max-width:416px;
                }

                .avivid_coupon_counter{
                    position: relative;
                    top: -1vh;
                }
                #secondary_page{
                    top: unset;
                    left: 36px;
                    bottom: 36px;
                    width: 140px;
                    padding-top: 20px;
                    padding-bottom: 20px;
                }
                .avivid_coupon_exit{
                    width: 50px;
                    left: 133px;
                    top: -24px;
                }
                #secondary_reciprocal{
                    position: relative;
                }

                #count-down-price{
                    clear: both;
                }

                .max_revenue .coupon_position {
                    align-items: center;
                    justify-content: center;
                }

                .max_revenue .avivid_coupon_cap {
                    
                }
                .max_revenue .avivid_coupon_content_wraper{
                    margin-left: 0.1vw;
                }
                .max_revenue .avivid_coupon_sep{
                    width: 100%;
                }
                .max_revenue .avivid_coupon_discard {
                    margin-right: 1vw;
                }

                .exit_coupon .coupon_position {
                    justify-content: center;
                }

                .exit_coupon .avivid_coupon_cap {
                    
                }
                .exit_coupon .avivid_coupon_content_wraper{
                    margin-left: 0.3vw;
                }
                .exit_coupon .avivid_coupon_sep{
                    width: 100%;
                }
                .exit_coupon .avivid_coupon_discard {
                    margin-right: 1vw;
                }

                .avivid_coupon_title{
                    font-size: 28px;
                }

                .avivid_coupon_description{
                    /* transform: scale(0.8);*/
                    font-size:36px;
                    margin: 24px 0 0 0;
                }

                .avivid_coupon{
                    transform: scale(0.8);
                }

                .avivid_coupon_code{
                    font-size: 36px;
                    /* transform: scale(0.8); */
                    margin:48px 0;
                }

                .avivid_coupon_help{
                    transform: scale(0.8);
                    font-size:16px;
                }

                .avivid_coupon_alert{
                    transform: scale(0.8);
                    font-size:16px;
                }
            }

            @media (min-width: 1400px) {
                #secondary_page{
                    top: unset;
                    left: 36px;
                    bottom: 36px;
                    width: 130px;
                }
                .avivid_coupon_exit{
                    width: 70px;
                    left: 120px;
                    top: -30px;
                }
                #secondary_reciprocal{
                }

                .max_revenue .avivid_coupon_cap {
                    

                }
                .max_revenue .avivid_coupon_content_wraper{
                }
                .max_revenue .avivid_coupon_sep{
                    width: 100%;
                }
                
                .exit_coupon .avivid_coupon_cap {
                    

                }
                .exit_coupon .avivid_coupon_content_wraper{
                    margin-left: 0.1vw;
                }
                .exit_coupon .avivid_coupon_sep{
                    width: 100%;
                }
            }
        }
        @media (orientation:landscape) {
            .avivid_main_page div:empty{
                display: block;
            }
            .avivid_main_page{
                background-color: rgb(0, 0, 0,0.8);
                min-width: 100%;
                height: 100vh;
                height: -webkit-fill-available;
                position: fixed;
                top: 0;
                bottom: 0;
                z-index: 2147483641;
                overflow: auto;
            }
            .coupon_position{
                position: relative;
                margin: auto;
                text-align: center;
                min-height: 100vh;
                display: flex;
                align-items: center;
                flex-direction: column;
                justify-content: start;
            }
            .text_background{
                border-bottom-left-radius: 50px;
                border-bottom-right-radius: 50px;
                width: 73.3%;
                position: absolute;
                left: 13.2%;
                top: 35%;
                text-align: center;
                z-index: 0;
            }
            .photo1{
                width: 90%;
                height: 43%;
                z-index: 1;
            }
            .photo2{
                position: absolute;
                top: 52%;
                left: 10%;
                background-position: center center;
                width: 78%;
                height: 36%;
                z-index: 2;
            }
            .coupon_backgroud{
                position: absolute;
                top: -5vw;
                left: 20vw;
                width: 60vw;
                height: 100vw;
            }
            #secondary_page{
                position: fixed;
                top: 65vh;
                border: 1px solid rgb(0, 0, 0,0.6);
                width: 15vw;
                height: 18.5vh;
                background-color: rgb(0, 0, 0,0.6);
                left: 3%;
                border-radius: 13px;
                display:none;
                z-index: 999;
                padding-top: 4vw;
                padding-bottom: 4vw;
            }
            #secondary_page [class*="col-"] {
                float: left;
                padding-right: 6%;
                padding-top:10%;
            }
            #secondary_page .col-1 {
                width: 1%;
                border:2px solid white;
            }
            #secondary_page .col-2 {
                width: 1%;
                border:1px solid white;
            }
            .avivid-bar-icon{
                padding-right: 6% !important;
                padding-left: 0 !important;
                flex: 0 !important;
            }
            @keyframes fade {
                from {
                    opacity: 0.1;
                }
                50% {
                    opacity: 1.5;
                }
                to {
                    opacity: 1.5;
                }
            }
            @-webkit-keyframes fade {
                from {
                    opacity: 0.1;
                }
                50% {
                    opacity: 1.5;
                }
                to {
                    opacity: 1.5;
                }
            }
            .blink {
                background-color: red;
                animation: fade 600ms infinite;
                -webkit-animation: fade 3s infinite;
            }
            #gif{
                animation-play-state: paused;
                -webkit-animation: fade 5s infinite;
            }
            .avivid_coupon_cap{
                background: url('https://rhea-cache.advividnetwork.com/coupon/img/mobile_coupon_cap.png');
                background-repeat: no-repeat;
                background-size:100%;
                width: 80.7vw;
                max-width:278px;
                height: 144px;
                background-position: top center;
            }
            .avivid_coupon_content_wraper{
                display: flex;
                flex-direction: column;
                align-items: center;
                background: #fff;
                width: 80.65vw;
                max-width:278px;
                margin-left: 0.3vw;
                padding: 0 2vw 20px 2vw;
                border-radius: 0 0 30px 30px;
                box-shadow: 0px 0px 10px 0px rgb(255 255 255 / 50%);
                box-sizing: border-box;
                position: relative;
                top: -1px;
            }
            .avivid_coupon_title{
                font-family: Noto sans;
                font-style: normal;
                font-weight: Bold;
                font-size: 16px;
                line-height: 140%;
                letter-spacing:1px;
                /* or 130% */
                text-align: center;
                color: #F78CA0;
            }
            .avivid_coupon_title_product{
                font-family: Noto sans;
                font-style: normal;
                font-weight: 1000;
                font-size: 20px;
                line-height: 26px;
                /* or 130% */
                text-align: center;
                color: #F78CA0;
            }
            .avivid_coupon_description{
                font-family: Noto sans;
                font-style: normal;
                font-weight: 300;
                font-size: 30px;
                line-height: 140%;
                /* or 140% */
                text-align: center;
                color: #606060;
                margin: 16px 0 0 0;
                display: -webkit-box;
                -webkit-line-clamp: 6;
                -webkit-box-orient: vertical;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: pre-line;
            }
            .avivid_coupon_description_locked{
                font-size: 30px;
                margin: 40px 0;
            }
            .avivid_coupon{
                font-family: Noto sans;
                font-style: normal;
                font-weight: normal;
                font-size: 15px;
                line-height: 15px;
                text-align: center;                
                color: #606060;           
                /* margin-top: 2vh; */
            }
            .avivid_coupon_code{
                font-family: Noto sans;
                font-style: normal;
                font-weight: Bold;
                letter-spacing:2px;
                font-size: 24px;
                line-height: 140%;
                text-align: center;       
                color: #606060;            
                margin:24px 0;
            }
            .avivid_coupon_help{
                font-family: Noto sans;
                font-style: normal;
                font-weight: 300;
                font-size: 10px;
                line-height: 140%;
                /* identical to box height, or 160% */
                text-align: center;
                color: #606060;
                margin: 1vh 0;
            }
            .avivid_coupon_sep{
                width: 100%;
                border: 1px dashed #606060;
                margin: 5px 0;
            }
            .avivid_coupon_alert{
                font-family: Noto sans;
                font-style: normal;
                font-weight: 300;
                font-size: 10px;
                line-height: 140%;
                /* or 175% */
                text-align: center;
                color: #606060;
                margin: 1vh 0;
            }
            .avivid_coupon_discard{
                width: 11vw;
            }
            .avivid_coupon_accept{
                width: 26vw;
            }
            .avivid_coupon_exit{
                position: absolute;
                width: 12vw;
                left: 32vw;
                top: -3vw;
            }  
            .hidden{
                display: none;
            }

            @media (min-width: 700px) {
                .avivid_coupon_cap{
                    background: url('https://rhea-cache.advividnetwork.com/coupon/img/pc_coupon_cap.png');
                    filter: drop-shadow(-1px -1px 9px rgba(0, 0, 0, 0.7));
                    max-width:416px;
                    background-size: 100%;
                    height: 260px;
                }

                .avivid_coupon_content_wraper{
                    box-shadow: 2px 8px 7px 2px rgb(0 0 0 / 30%), 0 6px 6px 0 rgb(0 0 0 / 19%);
                    max-width:416px;
                }
                
                .avivid_coupon_counter{
                    position: relative;
                    top: -24px;
                }
                #secondary_page{
                    top: unset;
                    left: 36px;
                    bottom: 36px;
                    width: 155px;
                    height: unset;
                    padding-bottom: unset;
                }
                .avivid_coupon_exit{
                    width: 52px;
                    left: 148px;
                    top: -24px;
                }
                #secondary_reciprocal{
                    margin-left: 26px;
                    position: relative;
                    top: -24px;
                }

                #count-down-price{
                    clear: both;
                    position: relative;
                    top: -20px;
                }

                .max_revenue .coupon_position {
                    align-items: center;
                    justify-content: center;
                }

                .max_revenue .avivid_coupon_cap {
                    
                }
                .max_revenue .avivid_coupon_content_wraper{
                    margin-left: 0.1vw;
                }
                .max_revenue .avivid_coupon_sep{
                    width: 100%;
                }
                .max_revenue .avivid_coupon_discard {
                    margin-right: 1vw;
                }

                .exit_coupon .coupon_position {
                    justify-content: center;
                }

                .exit_coupon .avivid_coupon_cap {
               
                }
                .exit_coupon .avivid_coupon_content_wraper{
                    margin-left: 0.3vw;
                }
                .exit_coupon .avivid_coupon_sep{
                    width: 100%;
                }
                .exit_coupon .avivid_coupon_discard {
                    margin-right: 1vw;
                }
                .avivid_coupon_title{
                    font-size: 28px;
                }

                .avivid_coupon_description{
                    /* transform: scale(0.8);*/
                    font-size:36px;
                    margin: 24px 0 0 0;
                }

                .avivid_coupon{
                    transform: scale(0.8);
                }

                .avivid_coupon_code{
                    font-size:36px;
                    /* transform: scale(0.8);*/
                    margin:48px 0;
                }

                .avivid_coupon_help{
                    transform: scale(0.8);
                    font-size:16px;
                }

                .avivid_coupon_alert{
                    transform: scale(0.8);
                    font-size:16px;
                }
            }

            @media (min-width: 1400px) {
                #secondary_page{
                    top: unset;
                    left: 36px;
                    bottom: 36px;
                    width: 173px;
                    padding-top: 50px;
                }
                .avivid_coupon_exit{
                    width: 70px;
                    left: 170px;
                    top: -33px;
                }
                #secondary_reciprocal{
                    margin-left: 30px;
                }

                .max_revenue .avivid_coupon_cap {
                    
                }
                .max_revenue .avivid_coupon_content_wraper{
                }
                .max_revenue .avivid_coupon_sep{
                    width: 100%;
                }


                .exit_coupon .avivid_coupon_cap {
                    
                }
                .exit_coupon .avivid_coupon_content_wraper{
                    margin-left: 0.1vw;
                }
                .exit_coupon .avivid_coupon_sep{
                    width: 100%;
                }
            }
        }
    </style>`;

        var main_div =
            `   
            <div class = 'avivid_main_page'>
                <div class = 'coupon_position'>
                    <div class='avivid_coupon_cap'></div>
                    <div class='avivid_coupon_content_wraper'>
                        <div class='avivid_coupon_title'>
                            <div>` + title + `</div>
                        </div>
                        <div class='avivid_coupon_description'>` + content + `</div>
                        <div class='avivid_coupon'></div>
                        <div class='avivid_coupon_code'>優惠碼` + code + `</div>
                        <div class='avivid_coupon_help'>請在購物車頁面「請輸入優惠碼」中輸入以上折扣代碼</div>
                        <div class='avivid_coupon_sep'></div>
                        <div class='avivid_coupon_alert'></div>     
                        <div class='avivid_coupon_btns' style = 'display: flex;width: 100%;justify-content: space-around;'>
                            <div id = 'avivid_coupon_discard_button' class='avivid_coupon_discard' onclick = 'AviviD.RemoveCoupon(` + is_exit + `)'>                        
                                <img src = 'https://rhea-cache.advividnetwork.com/coupon/Frame_18.png' style = 'width: 100%;'>                            
                            </div>
                            <div id = 'avivid_coupon_accept_button' class='avivid_coupon_accept' onclick = 'AviviD.AcceptCoupon(true, ` + timeset + `,is_exit=` + is_exit + `)'>                        
                                <img src = 'https://rhea-cache.advividnetwork.com/coupon/Frame_5.png' style = 'width: 100%;'>
                            </div> 
                        </div>               
                    </div>
                </div>            
            </div>
            
            <div id = 'secondary_page' onclick = 'AviviD.show_main_page()'>
                <div class='avivid_coupon_exit' onclick = 'AviviD.RemoveCoupon(` + is_exit + `)'>
                    <img src = 'https://rhea-cache.advividnetwork.com/coupon/XIcon.png' style = 'width: 50%;'>
                </div>
                <div class='avivid_coupon_counter' style = 'text-align: center;padding: 6px;display: grid;'>
                    <b style = 'color:white;'>優惠倒數</b>
                    <b id ='count-down-timer2' style = 'color:white;'></b>
                </div>
                <div style = 'width: 50px;position: absolute;top: 20%;left: 79%;'>
                    <img id = 'gif' src = 'https://rhea-cache.advividnetwork.com/coupon/animation_500.gif' style = 'width:60%'>
                </div>
                <div id = 'secondary_reciprocal' style = 'display:none'>
                    <span countdown1 = '10' class="col-2 avivid-bar-icon" style = 'border-top-left-radius:500px;border-bottom-left-radius:500px;background-color: #FEA285;'></span>
                    <span countdown1 = '8' class="col-2 avivid-bar-icon" style="background-color: #FCAF7D;"></span>
                    <span countdown1 = '7' class="col-2 avivid-bar-icon" style="background-color: #FBB877;"></span>
                    <span countdown1 = '6' class="col-2 avivid-bar-icon" style="background-color: #FBB778;"></span>
                    <span countdown1 = '9' class="col-2 avivid-bar-icon" style="background-color: #FDA682;"></span>
                    <span countdown1 = '5' class="col-2 avivid-bar-icon" style="background-color: #FABC74;"></span>
                    <span countdown1 = '4' class="col-2 avivid-bar-icon" style="background-color: #F9C072;"></span>
                    <span countdown1 = '3' class="col-2 avivid-bar-icon" style="background-color: #F9C56F;"></span>
                    <span countdown1 = '2' class="col-2 avivid-bar-icon" style="background-color: #F9D26F;"></span>
                    <span countdown1 = '1' class="col-2 avivid-bar-icon" style='border-top-right-radius:500px;border-bottom-right-radius:500px;background-color: #FFE37E;'></span>
                </div>
                <div id="count-down-price" style="text-align: center;padding: 6px;font-size:12px"></div>
            </div>
        `;
        var time_limit_div = `<div id="time-limit-text">(` + timeset + ` mins)</div>`;

        jQuery('head').append(coupon_css);
        jQuery('body').append(main_div);
        // if (AviviD.get_cookie_tracking('AviviD_is_coupon') == '1' || AviviD.get_cookie_tracking('AviviD_is_coupon') == '2' || AviviD.get_cookie_tracking('AviviD_is_coupon_b') == '1' && jQuery('.avivid_main_page').css('display') == 'none') {
        //     AviviD.show_secondary_page();
        // }

        //// append coupon_limit if existing
        var coupon_code_mode = is_exit ? AviviD.addFan.coupon_code_mode_exit : AviviD.addFan.coupon_code_mode;
        var coupon_url = is_exit ? AviviD.addFan.coupon_url_exit : AviviD.addFan.coupon_url;
        if (coupon_code_mode === 3 || coupon_url !== "_") { // url-type coupon
            jQuery('.avivid_coupon_description').addClass('avivid_coupon_description_locked');
            jQuery('.avivid_coupon, .avivid_coupon_code, .avivid_coupon_help').addClass('hidden');
        };
        AviviD.appendCouponLimit(limit);
        if (AviviD.addFan.promotion_switch === 1 || AviviD.addFan.check_cart_coupon) {
            AviviD.update_couponUI(is_exit, timeset);
        };
        // AviviD.update_couponUI(is_exit);
        if (timeset != 0) { // 限時
            jQuery('.avivid_coupon_title').append(time_limit_div);
        };
        if (mode == 1) { // 小鬧鐘
            //// go to next page or click multiple times at the same page, hide main page, show secondary page
            AviviD.AcceptCoupon(false, timeset, is_exit); // option to disable clickToClipboard
            AviviD.show_secondary_page();
        } else { // 折價卷主視窗
            //// first time to accept coupon, show main page, hide secondary page
            jQuery('.avivid_main_page').show();
        };

        // 若為最大化曝光或者ROAS皆套用此樣式
        // if(AviviD.addFan.check_max_revenue){
        // console.log('max_revenue');
        // }
        jQuery('.avivid_main_page').addClass("max_revenue");
        jQuery('.avivid_main_page').css('background', 'rgb(0,0,0,0.0)');

        // 若為離站挽回則套用此樣式
        if (AviviD.addFan.check_exit_coupon) {
            // console.log('exit_coupon');
            jQuery('.avivid_main_page').addClass("exit_coupon");
            jQuery('.avivid_main_page').removeClass("max_revenue");
            jQuery('.avivid_main_page').css('background', 'rgb(0,0,0,0.8)');
        }

        // 若未輸入description則隱藏
        if (AviviD.addFan.coupon_description === '_') {
            jQuery('.avivid_coupon_description').hide();
        }

        // 若未設定時間則隱藏
        if (AviviD.addFan.coupon_setTimer === 0) {
            jQuery('#time-limit-text').hide();
        }
    };
    AviviD.ClickToClipboard = function (text) {
        //// Copy the text inside the text field 
        navigator.clipboard.writeText(text);
        console.log("copy text: " + text);
        jQuery('.avivid_copy_message').fadeIn(100).fadeOut(1500);
    };
    // padding 0 if num<10, ex: 1 => 01
    AviviD.paddedFormat = function (num) {
        return num < 10 ? "0" + num : num;
    };
    AviviD.startCountDown = function () {
        let secondsprogress = (AviviD.addFan.AviviD_c_t_r + 1) / 10;
        let originsec = AviviD.addFan.AviviD_c_t_r + 1;
        let i = 1;
        var element = document.querySelector('#count-down-timer2');
        clearInterval(AviviD.addFan.countInterval); // clear old setInterval to prevent multiple counting
        AviviD.addFan.countInterval = setInterval(function () {
            //// update timer
            AviviD.addFan.AviviD_c_t_r_min = parseInt(AviviD.addFan.AviviD_c_t_r / 60);
            AviviD.addFan.AviviD_c_t_r_sec = parseInt(AviviD.addFan.AviviD_c_t_r % 60);
            element.innerHTML = AviviD.paddedFormat(AviviD.addFan.AviviD_c_t_r_min) + ':' + AviviD.paddedFormat(AviviD.addFan.AviviD_c_t_r_sec);
            if ((originsec - secondsprogress * i) < AviviD.addFan.AviviD_c_t_r) {
                jQuery('span[countdown=' + i + ']').addClass('blink');
                jQuery('span[countdown1=' + i + ']').addClass('blink');
            } else {
                jQuery('span[countdown=' + i + ']').removeClass('blink');
                jQuery('span[countdown=' + i + ']').css('background-color', '#C5C7C9');
                jQuery('span[countdown1=' + i + ']').removeClass('blink');
                jQuery('span[countdown1=' + i + ']').css('background-color', 'rgb(113 113 113)');
                i++;
            };
            AviviD.addFan.AviviD_c_t_r--;
            //// end of counter and coupon
            if (AviviD.addFan.AviviD_c_t_r <= 0) {
                // 1.clear counter
                clearInterval(AviviD.addFan.countInterval);
                // 2.remove counter UI
                jQuery('.avivid_main_page').remove();
                jQuery('#secondary_page').remove();
                // 3.clear and reset cookies
                AviviD.addFan.AviviD_is_coupon = 0;
                AviviD.addFan.AviviD_is_coupon_b = 1;
                AviviD.addFan.AviviD_c_t_r = 0;
                AviviD.set_cookie_minutes_tracking("AviviD_is_coupon", AviviD.addFan.AviviD_is_coupon, 0.01);
                AviviD.set_cookie_minutes_tracking("AviviD_is_coupon_b", AviviD.addFan.AviviD_is_coupon_b, 1 * 24 * 60);
                AviviD.set_cookie_minutes_tracking("AviviD_c_t_r", AviviD.addFan.AviviD_c_t_r, 0.1);
            };
        }, 1000);
    };
    AviviD.sleep = function (ms) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    };
    AviviD.AcceptCoupon = function (click_mode = true, setTimer = undefined, is_exit = false) {

        if (AviviD.likrTimer === undefined) {
            setTimeout(function () {
                AviviD.AcceptCoupon(click_mode = true, setTimer = undefined, is_exit = false);
            }, 500);
        } else {
            if (setTimer === undefined) {
                //// set up initial value automatically
                setTimer = is_exit ? AviviD.addFan.coupon_setTimer_exit : AviviD.addFan.coupon_setTimer;
            }
            var coupon_id = is_exit ? AviviD.addFan.coupon_id_exit : AviviD.addFan.coupon_id;

            //// change cookie when without time limit
            AviviD.addFan.AviviD_is_coupon_b = 1;
            AviviD.set_cookie_minutes_tracking("AviviD_is_coupon_b", 1, 1 * 24 * 60);
            AviviD.addFan.AviviD_is_coupon_e = 1;
            AviviD.set_cookie_minutes_tracking("AviviD_is_coupon_e", 1, 1 * 24 * 60);
            if (setTimer === 0) { // without time limit setting
                //// mark accepted
                AviviD.addFan.AviviD_is_coupon = 0;
                jQuery('.avivid_main_page').hide();
                AviviD.LikrEventTrackingAcceptCoupon(is_exit);
                AviviD.gtm_event_send_st('aceept_coupon_' + coupon_id, 'likr_event', location.href);
                AviviD.set_cookie_minutes_tracking("AviviD_is_coupon", 0, 0.1); // continue session
            } else { // with time limit
                //// initialize for AviviD.startCountDown()
                AviviD.addFan.AviviD_c_t_r = AviviD.addFan.AviviD_c_t_r === undefined ? 60 * setTimer : AviviD.addFan.AviviD_c_t_r;
                // AviviD.addFan.AviviD_c_t_r_min = typeof(AviviD.addFan.AviviD_c_t_r_min)==='undefined' ? AviviD.addFan.coupon_setTimer : AviviD.addFan.AviviD_c_t_r_min;
                // AviviD.addFan.AviviD_c_t_r_sec = typeof(AviviD.addFan.AviviD_c_t_r_sec)==='undefined' ? 0 : AviviD.addFan.AviviD_c_t_r_sec;
                AviviD.set_cookie_minutes_tracking("AviviD_c_t_r", AviviD.addFan.AviviD_c_t_r, AviviD.addFan.AviviD_c_t_r / 60);
                //// check if trigger sendCoupon event, 1.first time to click, 2.had_triggered_coupon in before_page
                if ((AviviD.addFan.AviviD_c_t_r === 60 * setTimer) || AviviD.addFan.had_triggered_coupon) { // first time to accept
                    // 1.send triggered acceptCoupon event
                    AviviD.LikrEventTrackingAcceptCoupon(is_exit);
                    AviviD.addFan.had_triggered_coupon = false;
                    AviviD.gtm_event_send_st('aceept_coupon_' + coupon_id, 'likr_event', location.href);
                    AviviD.addFan.AviviD_is_coupon = is_exit ? 2 : 1;
                    AviviD.set_cookie_minutes_tracking("AviviD_is_coupon", AviviD.addFan.AviviD_is_coupon, 60); // continue session
                };
                // show secondary page and timer
                setTimeout(() => {
                    jQuery('.avivid_main_page').hide();
                    jQuery('#secondary_page').show();
                    jQuery('#receive_button').attr('onclick', 'AviviD.show_secondary_page()');
                    jQuery('#secondary_reciprocal').show();
                    // start counting   
                    AviviD.startCountDown();
                    AviviD.sleep(4000).then(() => {
                        jQuery('#gif').hide();
                        AviviD.sleep(3000).then(() => {
                            jQuery('#gif').show();
                            AviviD.sleep(4000).then(() => {
                                jQuery('#gif').hide();
                                AviviD.sleep(3000).then(() => {
                                    jQuery('#gif').show();
                                    AviviD.sleep(4000).then(() => {
                                        jQuery('#gif').hide();
                                    });
                                });
                            });
                        });
                    });
                }, 800);
            };
            // console.log(is_exit, click_mode);
            var coupon_code = is_exit ? AviviD.addFan.coupon_code_exit : AviviD.addFan.coupon_code;
            var coupon_url = is_exit ? AviviD.addFan.coupon_url_exit : AviviD.addFan.coupon_url;
            var coupon_code_mode = is_exit ? AviviD.addFan.coupon_code_mode_exit : AviviD.addFan.coupon_code_mode;

            //// copy coupon code to clipboard
            if (click_mode) {
                // var coupon_url = is_exit ? AviviD.addFan.coupon_url_exit : AviviD.addFan.coupon_url;
                if (coupon_code_mode === 3 || coupon_url !== "_") { // url-type coupon        
                    // if (coupon_code_mode===3) {//open new tab if coupon url is set
                    window.open(coupon_url, '_blank');
                } else {
                    AviviD.ClickToClipboard(coupon_code);
                };
            };
            //// call onpage
            if (AviviD.likr_timer != 0 && typeof (AviviD.likr_timer) !== "string") {
                AviviD.waterfall_enable();
            };
        }
    };
    AviviD.show_main_page = function () {
        jQuery('.avivid_main_page').show();
        jQuery('#secondary_page').hide();
    };
    AviviD.show_secondary_page = function () {
        jQuery('.avivid_main_page').hide();
        jQuery('#secondary_page').show();
        AviviD.sleep(1000).then(() => {
            jQuery('#gif').show();
            AviviD.sleep(4000).then(() => {
                jQuery('#gif').hide();
                AviviD.sleep(3000).then(() => {
                    jQuery('#gif').show();
                    AviviD.sleep(4000).then(() => {
                        jQuery('#gif').hide();
                        AviviD.sleep(3000).then(() => {
                            jQuery('#gif').show();
                            AviviD.sleep(4000).then(() => {
                                jQuery('#gif').hide();
                            });
                        });
                    });
                });
            });
        });
    };

    //// for discard coupon-2
    AviviD.RemoveCoupon = function (is_exit = false) {

        if (AviviD.likrTimer === undefined) {
            setTimeout(function () {
                AviviD.RemoveCoupon(is_exit = false);
            }, 500);
        } else {
            // 1.set cookie
            AviviD.addFan.AviviD_is_coupon = 0;
            AviviD.addFan.AviviD_c_t_r = 0;
            AviviD.set_cookie_minutes_tracking("AviviD_is_coupon", AviviD.addFan.AviviD_is_coupon, 0.01);
            AviviD.set_cookie_minutes_tracking("AviviD_c_t_r", AviviD.addFan.AviviD_c_t_r, 0.01);
            AviviD.addFan.AviviD_is_coupon_b = 1;
            AviviD.set_cookie_minutes_tracking("AviviD_is_coupon_b", 1, 1 * 24 * 60);
            AviviD.addFan.AviviD_is_coupon_e = 1;
            AviviD.set_cookie_minutes_tracking("AviviD_is_coupon_e", 1, 1 * 24 * 60);
            // if (exit) {
            //     AviviD.addFan.AviviD_is_coupon_e = 1;
            //     AviviD.set_cookie_minutes_tracking("AviviD_is_coupon_e",1,1*24*60);
            // } else {
            //     AviviD.addFan.AviviD_is_coupon_b = 1;
            //     AviviD.set_cookie_minutes_tracking("AviviD_is_coupon_b",1,1*24*60);
            // };
            // 2.remove coupon
            clearInterval(AviviD.addFan.countInterval);
            jQuery('.avivid_main_page').remove();
            jQuery('#secondary_page').remove();
            // 3.send triggered discardCoupon event
            var coupon_id = is_exit ? AviviD.addFan.coupon_id_exit : AviviD.addFan.coupon_id;
            AviviD.LikrEventTrackingDiscardCoupon(is_exit);
            AviviD.gtm_event_send_st('discard_coupon_' + coupon_id, 'likr_event', location.href);
            //// cancel onpage
            if (AviviD.likr_timer !== 0 && typeof (AviviD.likr_timer) !== "string") {
                AviviD.waterfall_enable();
            };
        }
    };

    AviviD.addFan = typeof (AviviD.addFan) == 'undefined' ? {} : AviviD.addFan;
    AviviD.addFan.showing = false;
    AviviD.addFan.had_triggered_coupon = AviviD.get_urlparam('avivid_triggered_coupon') == 1 ? true : false;
    AviviD.addFan.had_triggered_af = AviviD.get_urlparam('avivid_triggered_af') == 1 ? true : false;
    //// AviviD_is_coupon, 1: normal coupons, 2: exit coupons
    AviviD.addFan.AviviD_is_coupon = (AviviD.get_cookie_tracking('AviviD_is_coupon') !== "NaN") ? parseInt(AviviD.get_cookie_tracking('AviviD_is_coupon')) : 0;
    AviviD.addFan.AviviD_is_coupon_b = (AviviD.get_cookie_tracking('AviviD_is_coupon_b') !== "NaN") ? parseInt(AviviD.get_cookie_tracking('AviviD_is_coupon_b')) : 0;
    AviviD.addFan.AviviD_is_coupon_e = (AviviD.get_cookie_tracking('AviviD_is_coupon_e') !== "NaN") ? parseInt(AviviD.get_cookie_tracking('AviviD_is_coupon_e')) : 0;
    if (AviviD.addFan.had_triggered_coupon) {
        //// directly show 2nd page
        AviviD.addFan.AviviD_is_coupon = 2;
        AviviD.addFan.AviviD_is_coupon_b = 1;
        AviviD.addFan.AviviD_is_coupon_e = 1;
        AviviD.addFan.AviviD_c_t_r = AviviD.get_urlparam('c_t_r') !== null ? parseInt(AviviD.get_urlparam('c_t_r')) : 1800;
        AviviD.set_cookie_minutes_tracking("AviviD_is_coupon", 2, 60);
        AviviD.set_cookie_minutes_tracking("AviviD_is_coupon_b", 1, 1 * 24 * 60);
        AviviD.set_cookie_minutes_tracking("AviviD_is_coupon_e", 1, 1 * 24 * 60);
    };

    //// A. call API to check coupon status, customer_type(0:all, 1:only new)
    // var data_status_array = await AviviD.fetch_coupon_status_all('rick');
    // data_status_array = data_status_array.filter(x=> x.max_revenue!==1) // filter out max_revenue
    var data_status_array = await AviviD.fetch_coupon_status_all(AviviD.web_id);
    AviviD.addFan.check_exit_coupon = data_status_array.filter(x => x.customer_type === 99).length >= 1;
    AviviD.addFan.check_cart_coupon = data_status_array.filter(x => x.customer_type === 5).length >= 1;

    //// without, do normally
    //// choose corresponding coupon using AviviD.record_user.i_pb
    if (AviviD.record_user.i_pb === 0) {
        //// find customer_type===1
        var data_status_array_filter = data_status_array.filter(x => x.customer_type === 1);
    } else if (AviviD.record_user.i_pb === 1) {
        let uuid = AviviD.get_cookie_tracking('AviviD_uuid');
        let pb_customer_type = await AviviD.fetch_regular_vip(AviviD.web_id, uuid);
        AviviD.addFan.regular_vip = pb_customer_type;
        var data_status_array_filter = [];
        //// test case, vip=1, regular=1, => coupon(vip=0,1, regular=0,1) => pass
        //// test case, vip=0, regular=1, => coupon(vip=0,1, regular=0,1) => pass
        //// test case, vip=0, regular=0, => coupon(vip=0,1, regular=0,1) => pass
        //// find customer_type===4 (vip)
        var data_status_array_filter = (pb_customer_type.vip === 1) ? data_status_array.filter(x => x.customer_type === 4) : data_status_array_filter;
        //// find customer_type===3 (regular)
        var data_status_array_filter = (pb_customer_type.regular === 1) && (data_status_array_filter.length) === 0 ? data_status_array.filter(x => x.customer_type === 3) : data_status_array_filter;
        //// find customer_type===2 (old)
        var data_status_array_filter = (data_status_array_filter.length) === 0 ? data_status_array.filter(x => x.customer_type === 2) : data_status_array_filter;
    };
    //// check if exit_coupon
    if (AviviD.addFan.check_exit_coupon) {
        // use original array
        // data_status_array_filter = data_status_array.filter(x=> x.customer_type===99);
        var data_status_exit = data_status_array.filter(x => x.customer_type === 99)[0];
    }
    /// if any cart's item can be parsed and cart_coupon exist, direct load cart_coupon
    var cart_id = AviviD.get_cookie_tracking("AviviD_cart_id") == 'NaN' ? 'NaN' : AviviD.get_cookie_tracking("AviviD_cart_id").split(',');
    if (cart_id !== 'NaN' && AviviD.addFan.check_cart_coupon) {
        AviviD.addFan.check_cart_coupon = false
        for (let i = 0; i < cart_id.length; i++) {
            var result = await AviviD.fetch_name_url_from_id(AviviD.web_id, cart_id[i]);
            if (result['name'] !== "_") {
                data_status_array_filter = data_status_array.filter(x => x.customer_type === 5);
                AviviD.addFan.check_cart_coupon = true
                break;
            };
        };
    };
    if (!AviviD.addFan.check_cart_coupon) {
        data_status_array_filter = data_status_array_filter.filter(x => x.customer_type != 5);
    }
    //// with max_revenue activity, direct load coupon
    AviviD.addFan.check_max_revenue = data_status_array_filter.filter(x => x.max_revenue === 1).length >= 1;
    if (AviviD.addFan.check_max_revenue) {
        data_status_array_filter = data_status_array_filter.filter(x => x.max_revenue === 1);
    };
    if (data_status_array_filter.length === 0) {
        var data_status = {
            status: false
        };
    } else {
        //// choose index of coupon according to AviviD.updated_cart_price
        var index_coupon = 0;
        var diff = -1;
        for (i = 0; i < data_status_array_filter.length; i++) {
            index_coupon = (Math.abs(AviviD.updated_cart_price - data_status_array_filter[i]['coupon_limit']) < diff) ? i : index_coupon;
            diff = Math.abs(AviviD.updated_cart_price - data_status_array_filter[i]['coupon_limit']);
        };
        var data_status = data_status_array_filter[index_coupon];
    };

    AviviD.addFan.coupon_status = (AviviD.get_urlparam('avivid_preview_coupon') == 1) ? true : data_status.status; // false: no available coupon, true: yes or preview mode
    AviviD.addFan.coupon_id = data_status.id; // use to get coupon information
    AviviD.addFan.coupon_customer_type = data_status.customer_type; // 1: new only (exclude is_purchase_brfore=1), 2: old only, 3: regular, 4: vip, 99: exit
    AviviD.addFan.website_type = data_status.website_type; // 0:normal, 1: one-page ecom
    AviviD.addFan.coupon_limit = data_status.coupon_limit;
    if (AviviD.get_urlparam('avivid_preview_coupon') == 1) {
        AviviD.addFan.coupon_status = true;
    }
    // check coupon status
    if (AviviD.addFan.coupon_status) { // coupon enable
        // AviviD.addFan.AviviD_is_coupon = ( AviviD.get_cookie_tracking('AviviD_is_coupon')!=="NaN" ) ? parseInt(AviviD.get_cookie_tracking('AviviD_is_coupon')) : 0;
        // AviviD.addFan.AviviD_is_coupon_b = ( AviviD.get_cookie_tracking('AviviD_is_coupon_b')!=="NaN" ) ? parseInt(AviviD.get_cookie_tracking('AviviD_is_coupon_b')) : 0;
        AviviD.addFan.AviviD_prob_p = (AviviD.get_cookie_tracking('AviviD_prob_p') !== "NaN") ? parseFloat(AviviD.get_cookie_tracking('AviviD_prob_p')) : 0;
        if (AviviD.get_urlparam('avivid_preview_coupon') == 1) {
            //// force to show coupon
            AviviD.addFan.AviviD_is_coupon = 1;
            AviviD.addFan.AviviD_is_coupon_b = 1;
            // assing parameters in preview-mode
            AviviD.addFan.coupon_id = (AviviD.get_urlparam('coupon_id')) ? parseInt(AviviD.get_urlparam('coupon_id')) : AviviD.addFan.coupon_id;
            AviviD.addFan.coupon_customer_type = (AviviD.get_urlparam('coupon_customer_type')) ? parseInt(AviviD.get_urlparam('coupon_customer_type')) : AviviD.addFan.coupon_customer_type;
            AviviD.addFan.website_type = (AviviD.get_urlparam('website_type')) ? parseInt(AviviD.get_urlparam('website_type')) : AviviD.addFan.website_type;
            AviviD.addFan.coupon_limit = (AviviD.get_urlparam('coupon_limit')) ? parseInt(AviviD.get_urlparam('coupon_limit')) : AviviD.addFan.coupon_limit;
            AviviD.addFan.AviviD_c_t_r = undefined;
        };
        //// max revenue mode
        if (AviviD.addFan.check_max_revenue && AviviD.addFan.AviviD_is_coupon_b === 0) {
            //// force to show or prepare coupon
            AviviD.addFan.AviviD_is_coupon = 1;
            AviviD.addFan.AviviD_is_coupon_b = 1;
        };

        //// C. check is_coupon cookies and customer_type
        //// D. call model if is_purchase_before=0, AviviD_is_coupon_b=0, AviviD_is_coupon=0
        // if (AviviD.addFan.AviviD_is_coupon_b==0 && AviviD.addFan.AviviD_is_coupon==0 && AviviD.record_user.i_pb!=1) {
        if (AviviD.addFan.AviviD_is_coupon_b == 0 && AviviD.addFan.AviviD_is_coupon == 0) {
            //call API to fetch model parameters
            var data_model = await AviviD.fetch_addFan_coupon_model(AviviD.web_id, AviviD.addFan.coupon_id);
            AviviD.addFan.lower_bound = data_model.lower_bound;
            AviviD.addFan.upper_bound = data_model.upper_bound;
            AviviD.addFan.model_keys = data_model.model_key_js.split(',');
            AviviD.addFan.model_parameters = data_model.model_value.split(',').map(x => parseFloat(x));
            AviviD.addFan.model_intercept = data_model.model_intercept;
            ////E. compute probability of purchase
            AviviD.get_model_X = function (record_user, keys) {
                var values = [];
                for (let i = 0; i < keys.length; i++) {
                    values.push(parseInt(record_user[keys[i]]));
                };
                return values;
            };
            AviviD.logistic_equation = function (X, coeff, intercept) {
                var Y = 0;
                for (let i = 0; i < X.length; i++) {
                    Y += coeff[i] * X[i];
                };
                Y += intercept;
                var prob = 1 / (1 + Math.exp(-Y));
                return prob;
            };
            //// compute prob. of purchase
            AviviD.addFan.model_X = AviviD.get_model_X(AviviD.record_user, AviviD.addFan.model_keys);
            AviviD.addFan.AviviD_prob_p = AviviD.logistic_equation(AviviD.addFan.model_X, AviviD.addFan.model_parameters, AviviD.addFan.model_intercept);
            AviviD.addFan.AviviD_prob_p = Number((AviviD.addFan.AviviD_prob_p).toFixed(5)); // round to .5f, Number((0.688689).toFixed(5))
            //// check if send coupon next page
            if (AviviD.addFan.AviviD_prob_p >= AviviD.addFan.lower_bound && AviviD.addFan.AviviD_prob_p <= AviviD.addFan.upper_bound) {
                //// yes to send. Going to next page within 60 min will send coupon next page successfully
                // 1. save to cookies
                AviviD.addFan.AviviD_is_coupon = 1;
                AviviD.addFan.AviviD_is_coupon_b = 1;
                AviviD.set_cookie_minutes_tracking("AviviD_is_coupon", AviviD.addFan.AviviD_is_coupon, 60);
                AviviD.set_cookie_minutes_tracking("AviviD_is_coupon_b", AviviD.addFan.AviviD_is_coupon_b, 60);
                AviviD.set_cookie_minutes_tracking("AviviD_prob_p", AviviD.addFan.AviviD_prob_p, 60);
                // 2. send triggered sendCoupon event
                AviviD.LikrEventTrackingSendCoupon();
            } else {
                //// do nothing
            };
            //// F. get coupon details(API)
        } else if (AviviD.addFan.AviviD_is_coupon_b == 1 && AviviD.addFan.AviviD_is_coupon == 1) { // show coupon both 1 (do not show when AviviD_is_coupon==2)
            // 1.call API to fetch coupon information, key: web_id, coupon_enable=1, coupon_delete=0, today>=start_time and today<=end_time
            var coupon_details = await AviviD.fetch_addFan_coupon_detials(AviviD.addFan.coupon_id);
            AviviD.addFan.coupon_title = coupon_details.title;
            AviviD.addFan.coupon_description = coupon_details.coupon_description;
            AviviD.addFan.coupon_code = coupon_details.coupon_code; // if no coupon to send, return null
            AviviD.addFan.coupon_setTimer = parseInt(coupon_details.coupon_time_limit); // 0: no timer, no secondary page
            AviviD.addFan.coupon_type = parseInt(coupon_details.coupon_type); // 折扣類型 {0:無設定 1:免運 2:元 3:% 4:n送n}
            AviviD.addFan.coupon_amount = coupon_details.coupon_amount;
            AviviD.addFan.coupon_code_mode = parseInt(coupon_details.coupon_code_mode); // 優惠券代碼模式{0:單一, 1:批量自動產生,2:批量上傳,3:連結型代碼}
            AviviD.addFan.link_code = coupon_details.link_code; // link code to join two tables
            AviviD.addFan.coupon_limit = coupon_details.coupon_limit; // limit- amount,limit-account,limit-order,limit-return,limit-bill=1000
            AviviD.addFan.coupon_url = coupon_details.coupon_url; //open link when accept btn click
            AviviD.addFan.coupon_waitingTime = parseInt(coupon_details.coupon_waitingTime) // second
            AviviD.addFan.promotion_switch = parseInt(coupon_details.promotion_switch); // 0: normal coupon, 1: promotion type
            AviviD.addFan.promotion_items_title = coupon_details.promotion_items_title; // 0: normal coupon, 1: promotion type
            AviviD.addFan.promotion_items_url = coupon_details.promotion_items_url; // 0: normal coupon, 1: promotion type
            AviviD.addFan.promotion_items = []
            for (let i = 0; i < AviviD.addFan.promotion_items_title.length; i++) {
                AviviD.addFan.promotion_items[i] = {
                    "name": AviviD.addFan.promotion_items_title[i],
                    "url": AviviD.addFan.promotion_items_url[i]
                };
            };
            // 2.if 批量code, call API to update is_send accroding to coupon_code
            if ([1, 2].includes(AviviD.addFan.coupon_code_mode)) {
                if (AviviD.get_cookie_tracking('AviviD_coupon_code') === "NaN") {
                    AviviD.addFan.coupon_code = await AviviD.fetch_addFan_batch_coupon_detials(AviviD.addFan.coupon_id);
                    AviviD.set_cookie_minutes_tracking("AviviD_coupon_code", AviviD.addFan.coupon_code, 30);
                    AviviD.update_addFan_coupon_is_send(AviviD.addFan.link_code, AviviD.addFan.coupon_code);
                } else {
                    AviviD.addFan.coupon_code = AviviD.get_cookie_tracking('AviviD_coupon_code')
                }
            };
            if (AviviD.addFan.coupon_code !== null) { // send coupon if coupon_code exist

                if (AviviD.platform_int === 2 || AviviD.platform_int == 3) {
                    AviviD.event.leave = "pagehide"
                } else {
                    AviviD.event.leave = "beforeunload"
                };
                //// to record coupon time remaining
                window.addEventListener(AviviD.event.leave, function (e) {
                    // AviviD.set_cookie_minutes_tracking("AviviD_is_coupon",AviviD.addFan.AviviD_is_coupon,30);
                    if (AviviD.get_cookie_tracking('AviviD_is_coupon') != "NaN") { // cookie exitsting, continue refresh cookie for tracking
                        AviviD.set_cookie_minutes_tracking("AviviD_is_coupon", AviviD.addFan.AviviD_is_coupon, 30);
                    };
                    if (AviviD.addFan.AviviD_is_coupon === 1 && AviviD.addFan.AviviD_c_t_r !== undefined) { // counting mode
                        AviviD.set_cookie_minutes_tracking("AviviD_c_t_r", AviviD.addFan.AviviD_c_t_r, AviviD.addFan.AviviD_c_t_r / 60);
                        console.log('save coupon timer remaining time to cookie');
                    };
                });

                //// check AviviD_c_t_r(coupon time remaining) and initialize AviviD.addFan.AviviD_c_t_r when in counting mode
                AviviD.addFan.AviviD_c_t_r = (AviviD.get_cookie_tracking('AviviD_c_t_r') != "NaN") ? parseInt(AviviD.get_cookie_tracking('AviviD_c_t_r')) : AviviD.addFan.AviviD_c_t_r;

                if ((AviviD.addFan.AviviD_c_t_r === undefined || AviviD.addFan.AviviD_c_t_r === 0) && AviviD.check_addfan_rules()) {
                    //// first time to accept coupon
                    // 1.show coupon (main page)
                    if (AviviD.addFan.check_max_revenue) {
                        // console.log("wait 12s")
                        AviviD.addFan.coupon_timeout = setTimeout(() => {
                            if (AviviD.likrTimer === undefined) {
                                setTimeout(function () {
                                    AviviD.addFan.coupon_timeout();
                                }, 500);
                            } else {
                                AviviD.Promotion_coupons(AviviD.addFan.coupon_title, AviviD.addFan.coupon_description, AviviD.addFan.coupon_code, AviviD.addFan.coupon_setTimer, AviviD.addFan.coupon_limit, 0);
                                AviviD.addFan.showing = true;
                                AviviD.likrTimer.clearTimer();
                            }
                        }, AviviD.addFan.coupon_waitingTime * 1000);

                        // clearTimeout(AviviD.addFan.coupon_timeout);
                    } else {
                        // no delay
                        AviviD.Promotion_coupons(AviviD.addFan.coupon_title, AviviD.addFan.coupon_description, AviviD.addFan.coupon_code, AviviD.addFan.coupon_setTimer, AviviD.addFan.coupon_limit, 0);
                        AviviD.addFan.showing = true;
                        if (AviviD.likrTimer === undefined) {
                            setTimeout(function () {
                                AviviD.likrTimer.clearTimer();
                            }, 500);
                        } else {
                            AviviD.likrTimer.clearTimer();
                        }
                    };

                } else if (AviviD.addFan.AviviD_c_t_r !== undefined) {
                    //// time remaining >= 0, next page or click multiple times at one page case
                    // 1.directly show secondary page
                    AviviD.Promotion_coupons(AviviD.addFan.coupon_title, AviviD.addFan.coupon_description, AviviD.addFan.coupon_code, AviviD.addFan.coupon_setTimer, AviviD.addFan.coupon_limit, 1);
                };
            }; //// check coupon_code is not null
        };
    } else { //do nothing
        console.log('no avilable coupon');
    };

    //// deal with exit_coupon
    if (AviviD.addFan.check_exit_coupon) {
        AviviD.addFan.coupon_id_exit = data_status_exit.id;
        // 1.call API to fetch coupon information, key: web_id, coupon_enable=1, coupon_delete=0, today>=start_time and today<=end_time
        var coupon_details_exit = await AviviD.fetch_addFan_coupon_detials(AviviD.addFan.coupon_id_exit);
        AviviD.addFan.coupon_title_exit = coupon_details_exit.title;
        AviviD.addFan.coupon_description_exit = coupon_details_exit.coupon_description;
        AviviD.addFan.coupon_code_exit = coupon_details_exit.coupon_code; // if no coupon to send, return null
        AviviD.addFan.coupon_setTimer_exit = parseInt(coupon_details_exit.coupon_time_limit); // 0: no timer, no secondary page
        AviviD.addFan.coupon_type_exit = parseInt(coupon_details_exit.coupon_type); // 折扣類型 {0:無設定 1:免運 2:元 3:% 4:n送n}
        AviviD.addFan.coupon_amount_exit = coupon_details_exit.coupon_amount;
        AviviD.addFan.coupon_code_mode_exit = parseInt(coupon_details_exit.coupon_code_mode); // 0:單一, 1:批量
        AviviD.addFan.link_code_exit = coupon_details_exit.link_code; // link code to join two tables
        AviviD.addFan.coupon_limit_exit = coupon_details_exit.coupon_limit; // limit- amount,limit-account,limit-order,limit-return,limit-bill=1000
        AviviD.addFan.coupon_url_exit = coupon_details_exit.coupon_url; //open link when accept btn click
        AviviD.addFan.coupon_waitingTime_exit = parseInt(coupon_details_exit.coupon_waitingTime) // second
        AviviD.addFan.promotion_switch_exit = parseInt(coupon_details_exit.promotion_switch); // 0: normal coupon, 1: promotion type
        AviviD.addFan.promotion_items_title_exit = coupon_details_exit.promotion_items_title; // 0: normal coupon, 1: promotion type
        AviviD.addFan.promotion_items_url_exit = coupon_details_exit.promotion_items_url; // 0: normal coupon, 1: promotion type
        AviviD.addFan.promotion_items_exit = [];
        for (let i = 0; i < AviviD.addFan.promotion_items_title_exit.length; i++) {
            AviviD.addFan.promotion_items_exit[i] = {
                "name": AviviD.addFan.promotion_items_title_exit[i],
                "url": AviviD.addFan.promotion_items_url_exit[i]
            };
        };

        if (AviviD.platform_int === 2 || AviviD.platform_int == 3) {
            AviviD.event.leave = "pagehide"
        } else {
            AviviD.event.leave = "beforeunload"
        };
        //// to record coupon time remaining
        window.addEventListener(AviviD.event.leave, function (e) {
            if (AviviD.addFan.AviviD_is_coupon === 2 && AviviD.addFan.AviviD_c_t_r !== undefined) { // counting mode
                AviviD.set_cookie_minutes_tracking("AviviD_c_t_r", AviviD.addFan.AviviD_c_t_r, AviviD.addFan.AviviD_c_t_r / 60);
                console.log('save coupon timer remaining time to cookie');
            };
        });

        //// check AviviD_c_t_r(coupon time remaining) and initialize AviviD.addFan.AviviD_c_t_r when in counting mode
        AviviD.addFan.AviviD_c_t_r = (AviviD.get_cookie_tracking('AviviD_c_t_r') !== "NaN") ? parseInt(AviviD.get_cookie_tracking('AviviD_c_t_r')) : AviviD.addFan.AviviD_c_t_r;

        if (AviviD.addFan.AviviD_c_t_r === undefined && AviviD.check_addfan_rules()) {
            AviviD.addFan.exit_coupon = function () {
                if (AviviD.settings.before_page_enable === undefined) {
                    setTimeout(function () {
                        AviviD.addFan.exit_coupon();
                    }, 500);
                } else if (AviviD.settings.before_page_enable !== "1" && AviviD.get_feature_domain(document.referrer) !== "gaii.ai" && AviviD.get_feature_domain(location.href) !== AviviD.get_feature_domain(document.referrer)) {
                    // no before_page and exit current domain
                    // window.history.pushState("", "", window.location.href + "#");
                    window.history.pushState("", "", window.location.href);
                    window.addEventListener("popstate", e => {
                        if (!AviviD.addFan.showing && AviviD.addFan.AviviD_is_coupon_e === 0) {
                            AviviD.Promotion_coupons(AviviD.addFan.coupon_title_exit, AviviD.addFan.coupon_description_exit, AviviD.addFan.coupon_code_exit, AviviD.addFan.coupon_setTimer_exit, AviviD.addFan.coupon_limit_exit, 0, true);
                            //// add impression
                            AviviD.LikrEventTrackingDiscardCoupon(true);
                            AviviD.addFan.showing = true;
                            clearTimeout(AviviD.addFan.coupon_timeout);

                            if (AviviD.likrTimer === undefined) {
                                setTimeout(function () {
                                    AviviD.likrTimer.clearTimer();
                                }, 500);
                            } else {
                                AviviD.likrTimer.clearTimer();
                            }
                            // AviviD.addFan.AviviD_is_coupon = 2;
                            // AviviD.addFan.AviviD_is_coupon_e = 1;
                            // AviviD.set_cookie_minutes_tracking("AviviD_is_coupon", 2, 60);
                            // AviviD.set_cookie_minutes_tracking("AviviD_is_coupon_e", 1, 1*24*60);

                        };
                    });
                };
            };
            AviviD.addFan.exit_coupon();
            // AviviD.addFan.AviviD_is_coupon = 2;
            // AviviD.set_cookie_minutes_tracking("AviviD_is_coupon", 2, 60);
        } else if (AviviD.addFan.AviviD_c_t_r !== undefined && AviviD.addFan.AviviD_is_coupon === 2) {
            AviviD.Promotion_coupons(AviviD.addFan.coupon_title_exit, AviviD.addFan.coupon_description_exit, AviviD.addFan.coupon_code_exit, AviviD.addFan.coupon_setTimer_exit, AviviD.addFan.coupon_limit_exit, 1, true);
        };
    };


    //// API to give the highest prioity ad ranked by remaining days
    AviviD.fetch_ad_status = async function (web_id) {
        return new Promise((resolve, reject) => {
            let url = 'https://rhea-cache.advividnetwork.com/api/coupon/ad_status'; // https://rhea-cache.advividnetwork.com/api/
            jQuery.ajax({
                type: 'GET',
                url: url,
                cache: true,
                dataType: 'json',
                data: {
                    'web_id': web_id
                },
                success: function (result) {
                    resolve(result)
                },
                fail: function (xhr, ajaxOptions, thrownError) {
                    reject(false)
                },
            });
        });
    };
    //// API to give the highest prioity ad ranked by remaining days
    AviviD.fetch_ad_status_all = async function (web_id) {
        return new Promise((resolve, reject) => {
            let url = 'https://rhea-cache.advividnetwork.com/api/coupon/ad_status_all'; // https://rhea-cache.advividnetwork.com/api/
            jQuery.ajax({
                type: 'GET',
                url: url,
                cache: true,
                dataType: 'json',
                data: {
                    'web_id': web_id
                },
                success: function (result) {
                    resolve(result)
                },
                fail: function (xhr, ajaxOptions, thrownError) {
                    reject(false)
                },
            });
        });
    };
    AviviD.check_allow_addfan = function () {
        if (AviviD.get_urlparam('avivid_preview_afad') == 1) {
            //// force to show addfan
            return true;
        } else {
            return AviviD.addFan.AviviD_is_addfan_b === 0 && AviviD.record_user.ps >= 3;
        };
    };
    AviviD.addFan.AviviD_is_addfan_b = (AviviD.get_cookie_tracking('AviviD_is_addfan_b') !== "NaN") ? parseInt(AviviD.get_cookie_tracking('AviviD_is_addfan_b')) : 0;
    //// 1. check available ad, if not sending coupon
    if (AviviD.check_allow_addfan()) {
        var ad_status = await AviviD.fetch_ad_status(AviviD.web_id);
        AviviD.addFan.ad_status = ad_status.status; // 0: no available ad, 1: yes
        AviviD.addFan.ad_id = ad_status.id; // use to get ad information
        AviviD.addFan.website_type = ad_status.website_type; // 0:normal, 1: one-page ecom
        if (AviviD.get_urlparam('avivid_preview_afad') == 1) {
            //// force to show coupon
            AviviD.addFan.AviviD_is_addfan_b = 0;
            AviviD.addFan.ad_status = true;
            AviviD.addFan.ad_id = (AviviD.get_urlparam('ad_id')) ? parseInt(AviviD.get_urlparam('ad_id')) : AviviD.addFan.ad_id;
        } else {
            //// normal case
            AviviD.addFan.AviviD_is_addfan_b = (AviviD.get_cookie_tracking('AviviD_is_addfan_b') !== "NaN") ? parseInt(AviviD.get_cookie_tracking('AviviD_is_addfan_b')) : 0;
        };
        //// 2. call addfan_ad if ad_status=1, AviviD_is_addfan_b=0
        if (AviviD.addFan.ad_status && AviviD.addFan.AviviD_is_addfan_b == 0) {
            //// API to give model for sending afad
            AviviD.fetch_addFan_ad_model = async function (web_id, coupon_id) {
                return new Promise((resolve, reject) => {
                    let url = 'https://rhea-cache.advividnetwork.com/api/coupon/model2'; // https://rhea-cache.advividnetwork.com/api/
                    jQuery.ajax({
                        type: 'GET',
                        url: url,
                        cache: true,
                        dataType: 'json',
                        data: {
                            'web_id': web_id,
                            'coupon_id': coupon_id
                        },
                        success: function (result) {
                            resolve(result)
                        },
                        fail: function (xhr, ajaxOptions, thrownError) {
                            reject(false)
                        },
                    })
                })
            };
            //// API to give ad details (use ad id)
            AviviD.fetch_addFan_ad_detials = async function (ad_id) {
                return new Promise((resolve, reject) => {
                    let url = 'https://rhea-cache.advividnetwork.com/api/coupon/ad_details'; // https://rhea-cache.advividnetwork.com/api/
                    jQuery.ajax({
                        type: 'GET',
                        url: url,
                        cache: true,
                        dataType: 'json',
                        data: {
                            'ad_id': ad_id
                        },
                        success: function (result) {
                            resolve(result)
                        },
                        fail: function (xhr, ajaxOptions, thrownError) {
                            reject(false)
                        },
                    });
                });
            };
            AviviD.LikrEventTrackingSendAfAd = function () {
                let ga_id = (AviviD.get_cookie_tracking('_ga') != "NaN") ? AviviD.get_cookie_tracking('_ga') : AviviD.get_cookie_tracking('gaClientId');
                let uuid = AviviD.get_cookie_tracking('AviviD_uuid');
                let fb_id = AviviD.get_cookie_tracking('_fbp');
                let ip = (AviviD.clientIP === undefined) ? "_" : AviviD.clientIP;
                let is_coupon = (AviviD.get_cookie_tracking('AviviD_is_coupon') !== "NaN") ? AviviD.get_cookie_tracking('AviviD_is_coupon') : 0;
                let afad_info = {
                    "p_p": AviviD.addFan.AviviD_prob_p,
                    "l_b": AviviD.addFan.lower_bound,
                    "u_b": AviviD.addFan.upper_bound,
                    "m_k": AviviD.addFan.model_keys,
                    "m_p": AviviD.addFan.model_parameters,
                    "m_i": AviviD.addFan.model_intercept,
                    "m_X": AviviD.addFan.model_X,
                    "a_i": AviviD.addFan.ad_id,
                    "w_t": AviviD.addFan.website_type,
                };
                let tracking_data = {
                    'web_id': AviviD.web_id,
                    'uuid': uuid,
                    'ga_id': ga_id,
                    'fb_id': fb_id,
                    'ip': ip,
                    'timestamp': Date.now(),
                    "behavior_type": "likrTracking",
                    'event_type': "sendAfAd",
                    "coupon": is_coupon,
                    'record_user': AviviD.record_user,
                    "afad_info": afad_info,
                };
                //// don't send if in preview mode
                if (AviviD.get_urlparam('avivid_preview_afad') != 1) {
                    AviviD.tracking_data_aws_put.construct(tracking_data);
                    console.log("trigger sendAfAd event");
                };
            };

            AviviD.LikrEventTrackingAcceptAd = function () {
                let ga_id = (AviviD.get_cookie_tracking('_ga') != "NaN") ? AviviD.get_cookie_tracking('_ga') : AviviD.get_cookie_tracking('gaClientId');
                let uuid = AviviD.get_cookie_tracking('AviviD_uuid');
                let fb_id = AviviD.get_cookie_tracking('_fbp');
                let ip = (AviviD.clientIP === undefined) ? "_" : AviviD.clientIP;
                let is_coupon = (AviviD.get_cookie_tracking('AviviD_is_coupon') !== "NaN") ? AviviD.get_cookie_tracking('AviviD_is_coupon') : 0;
                let afad_info = {
                    "l_b": AviviD.addFan.lower_bound,
                    "p_p": AviviD.addFan.AviviD_prob_p,
                    "a_i": AviviD.addFan.ad_id,
                    "w_t": AviviD.addFan.website_type,

                };
                let tracking_data = {
                    'web_id': AviviD.web_id,
                    'uuid': uuid,
                    'ga_id': ga_id,
                    'fb_id': fb_id,
                    'ip': ip,
                    'timestamp': Date.now(),
                    "behavior_type": "likrTracking",
                    'event_type': "acceptAd",
                    "coupon": is_coupon,
                    'record_user': AviviD.record_user,
                    "afad_info": afad_info,
                };
                //// don't send if in preview mode
                if (AviviD.get_urlparam('avivid_preview_afad') != 1) {
                    AviviD.tracking_data_aws_put.construct(tracking_data);
                    console.log("trigger acceptAd event");
                };
            };

            AviviD.LikrEventTrackingAcceptAf = function () {
                let ga_id = (AviviD.get_cookie_tracking('_ga') != "NaN") ? AviviD.get_cookie_tracking('_ga') : AviviD.get_cookie_tracking('gaClientId');
                let uuid = AviviD.get_cookie_tracking('AviviD_uuid');
                let fb_id = AviviD.get_cookie_tracking('_fbp');
                let ip = (AviviD.clientIP === undefined) ? "_" : AviviD.clientIP;
                let is_coupon = (AviviD.get_cookie_tracking('AviviD_is_coupon') !== "NaN") ? AviviD.get_cookie_tracking('AviviD_is_coupon') : 0;
                let afad_info = {
                    "l_b": AviviD.addFan.lower_bound,
                    "p_p": AviviD.addFan.AviviD_prob_p,
                    "a_i": AviviD.addFan.ad_id,
                    "w_t": AviviD.addFan.website_type,

                };
                let tracking_data = {
                    'web_id': AviviD.web_id,
                    'uuid': uuid,
                    'ga_id': ga_id,
                    'fb_id': fb_id,
                    'ip': ip,
                    'timestamp': Date.now(),
                    "behavior_type": "likrTracking",
                    'event_type': "acceptAf",
                    "coupon": is_coupon,
                    'record_user': AviviD.record_user,
                    "afad_info": afad_info,
                };
                //// don't send if in preview mode
                if (AviviD.get_urlparam('avivid_preview_afad') != 1) {
                    AviviD.tracking_data_aws_put.construct(tracking_data);
                    console.log("trigger acceptAf event");
                };
            };

            AviviD.LikrEventTrackingDiscardAfAd = function () {
                let ga_id = (AviviD.get_cookie_tracking('_ga') != "NaN") ? AviviD.get_cookie_tracking('_ga') : AviviD.get_cookie_tracking('gaClientId');
                let uuid = AviviD.get_cookie_tracking('AviviD_uuid');
                let fb_id = AviviD.get_cookie_tracking('_fbp');
                let ip = (AviviD.clientIP === undefined) ? "_" : AviviD.clientIP;
                let is_coupon = (AviviD.get_cookie_tracking('AviviD_is_coupon') !== "NaN") ? AviviD.get_cookie_tracking('AviviD_is_coupon') : 0;
                let afad_info = {
                    "p_p": AviviD.addFan.AviviD_prob_p,
                    "a_i": AviviD.addFan.ad_id,
                    "w_t": AviviD.addFan.website_type,
                };
                let tracking_data = {
                    'web_id': AviviD.web_id,
                    'uuid': uuid,
                    'ga_id': ga_id,
                    'fb_id': fb_id,
                    'ip': ip,
                    'timestamp': Date.now(),
                    "behavior_type": "likrTracking",
                    'event_type': "discardAfAd",
                    "coupon": is_coupon,
                    'record_user': AviviD.record_user,
                    "afad_info": afad_info,
                };
                //// don't send if in preview mode
                if (AviviD.get_urlparam('avivid_preview_afad') != 1) {
                    AviviD.tracking_data_aws_put.construct(tracking_data);
                    console.log("trigger discardAfAd event");
                };
            };
            var ad_model = await AviviD.fetch_addFan_ad_model(AviviD.web_id, AviviD.addFan.ad_id);
            AviviD.addFan.lower_bound = ad_model.lower_bound;
            AviviD.addFan.upper_bound = ad_model.upper_bound;
            AviviD.addFan.model_keys = ad_model.model_key_js.split(',');
            AviviD.addFan.model_parameters = ad_model.model_value.split(',').map(x => parseFloat(x));
            AviviD.addFan.model_intercept = ad_model.model_intercept;
            AviviD.get_model_X = function (record_user, keys) {
                var values = [];
                for (let i = 0; i < keys.length; i++) {
                    values.push(parseInt(record_user[keys[i]]));
                };
                return values;
            };
            AviviD.logistic_equation = function (X, coeff, intercept) {
                var Y = 0;
                for (let i = 0; i < X.length; i++) {
                    Y += coeff[i] * X[i];
                };
                Y += intercept;
                var prob = 1 / (1 + Math.exp(-Y));
                return prob;
            };
            //// compute prob. of purchase
            AviviD.addFan.model_X = AviviD.get_model_X(AviviD.record_user, AviviD.addFan.model_keys);
            AviviD.addFan.AviviD_prob_p = AviviD.logistic_equation(AviviD.addFan.model_X, AviviD.addFan.model_parameters, AviviD.addFan.model_intercept);
            AviviD.addFan.AviviD_prob_p = Number((AviviD.addFan.AviviD_prob_p).toFixed(5)); // round to .5f, Number((0.688689).toFixed(5))
            if (AviviD.addFan.AviviD_prob_p < AviviD.addFan.lower_bound) {
                var ad_details = await AviviD.fetch_addFan_ad_detials(AviviD.addFan.ad_id);
                AviviD.addFan.ad_image_url = ad_details.ad_image_url == '0' ? 'https://rhea-cache.advividnetwork.com/coupon/img/line_default.svg' : ad_details.ad_image_url; // image to display
                AviviD.addFan.ad_comment = ad_details.ad_comment == '_' ? '' : ad_details.ad_comment; // comment to display
                AviviD.addFan.ad_url = ad_details.ad_url; // url to redirect when click image
                AviviD.addFan.ad_btn_url = ad_details.ad_btn_url; // url to redirect when click button
                AviviD.addFan.ad_btn_text = ad_details.ad_btn_text; // button text to display
                AviviD.addFan.ad_btn_color = ad_details.ad_btn_color; // button color
                AviviD.onclick_redirect = function (url, mode = 0) { // 0:clicking a link, 1:open new tab               
                    (mode === 0) ? window.location.href(url) : window.open(url, '_blank');
                    jQuery(".avivid_addfan_page").hide(500);
                };
                AviviD.trigger_ad = function (url) { // 0:clicking a link, 1:open new tab       

                    if (AviviD.likrTimer === undefined) {
                        setTimeout(function () {
                            AviviD.trigger_ad(url);
                        }, 500);
                    } else {
                        AviviD.LikrEventTrackingAcceptAd();
                        window.open(url, '_blank');
                        jQuery(".avivid_addfan_page").hide(500);
                        if (AviviD.likr_timer != 0 && typeof (AviviD.likr_timer) !== "string") {
                            AviviD.waterfall_enable();
                        };
                    }
                };
                AviviD.trigger_af = function (url) { // 0:clicking a link, 1:open new tab       

                    if (AviviD.likrTimer === undefined) {
                        setTimeout(function () {
                            AviviD.trigger_af(url);
                        }, 500);
                    } else {
                        AviviD.LikrEventTrackingAcceptAf();
                        window.open(url, '_blank');
                        jQuery(".avivid_addfan_page").hide(500);
                        if (AviviD.likr_timer != 0 && typeof (AviviD.likr_timer) !== "string") {
                            AviviD.waterfall_enable();
                        };
                    }
                };
                AviviD.close_addfan_page = function () {

                    if (AviviD.likrTimer === undefined) {
                        setTimeout(function () {
                            AviviD.close_addfan_page();
                        }, 500);
                    } else {
                        AviviD.LikrEventTrackingDiscardAfAd();
                        jQuery(".avivid_addfan_page").remove();
                        if (AviviD.likr_timer != 0 && typeof (AviviD.likr_timer) !== "string") {
                            AviviD.waterfall_enable();
                        };
                    }
                };
                AviviD.Promotion_ad = function () {
                    let ad_css =
                        `
                    <style>
                    @media (orientation:portrait) {
                        .avivid_main_page div:empty{
                            display: block;
                        }
                        .avivid_addfan_page {
                            width: 100%;
                            height: 100%;
                            position: fixed;
                            left: 0;
                            top: 0;
                            margin: auto;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            background-color: rgba(0, 0, 0, .6);
                            z-index: 2147483645;
                        }
                        .avivid_addfan_wrapper {
                            position: relative;
                            top: -15vw;
                            width: 75vw;
                            height: 100vw;
                        }
                        .avivid_addfan_close {
                            position: relative;
                            top: 13vw;
                            left: 65vw;
                            width: 9vw;
                            z-index: 1000;
                            cursor: pointer;
                        }

                        .avivid_addfan_img_wrapper {
                            position: relative;
                            top: 0vw;
                            width: 75vw;
                            height: 100vw; 
                            border-width: 0;
                            padding: 0;
                        }
                        .avivid_addfan_img {
                            position: relative;
                            width: 100%;
                            height: 100%; 
                            object-fit: fill;
                            cursor: pointer;
                        }
                        .avivid_addfan_comment{
                                position: absolute;
                                top: 50%;
                                left: 0;
                                transform: translate(0, -50%);
                                padding: 10px;
                                text-align: center;
                                width: 100%;
                                color: black;
                        }
                        .avivid_line_fans_btn_wrapper{
                            position: relative;
                            top: 0.8vw;
                            left: 0.2vw;
                            width: 19vw;
                            height: 4vw;
                            
                        }
                        .avivid_line_fans_btn {
                            position: relative;
                            top: -2vw;
                            width: 75vw;
                            height: 15vw;
                            background-color: ` + AviviD.addFan.ad_btn_color + `;
                            cursor: pointer;
                            display: flex;
                            justify-content: center;
                            align-items: center;

                        }
                        .avivid_addfan_logo {
                            position: absolute;
                            bottom: 5px;
                            right: 5px;
                            width: 50px;
                        }
                        .avivid_addfan_text {
                            font-size: 5vw;
                            font-weight: 700;
                            color: white;
                            margin: 0;
                        }
                        @media (min-width: 700px){
                            .avivid_addfan_close{
                                top: 11vw;
                                left: 54vw;
                                width: 3vw;
                            }
                            .avivid_addfan_img_wrapper {
                                top: 31vw;
                                width: 29vw;
                                height: 37vw;
                                left: 22vw;
                            }
                            .avivid_line_fans_btn_wrapper{
                                position: relative;
                                top: 30.8vw;
                                left: 25.4vw;
                                width: 29vw;
                                height: 4vw;
                                background: white;
                            }
                            .avivid_line_fans_btn{
                                position: absolute;
                                top: 0.5vw;
                                left: 5vw;
                                width: 20vw;
                                height: 3vw;
                                border: none;
                                border-radius: 5px;
                                box-shadow: 2px 2px 2px 1px rgb(0 0 0 / 20%);
                            }
                            .avivid_line_fans_btn:hover{
                                box-shadow: 0px 0px 21px 10px rgba(97,97,95,0.75);
                            }
                            .avivid_addfan_text{
                                font-size: 1.3vw;
                            }
                            .avivid_addfan_logo{
                                width: 30px;
                            }
                        }

                        @media (min-width: 1400px){
                            .avivid_addfan_close{
                                top: 29.4vw;
                                left: 48vw;
                                width: 2vw;
                            }
                            .avivid_addfan_img_wrapper {
                                top: 43vw;
                                width: 19vw;
                                height: 25vw;
                                left: 27vw;
                            }
                            .avivid_line_fans_btn_wrapper{
                                top: 42.8vw;
                                left: 29.2vw;
                                width: 19vw;
                                height: 4vw;
                            }
                            .avivid_line_fans_btn{
                                top: 0.5vw;
                                left: 2.5vw;
                                width: 14vw;
                                height: 3vw;
                            }
                            .avivid_line_fans_btn:hover{
                                
                            }
                            .avivid_addfan_text{
                                font-size: 1.5vw;
                            }
                        }
                    }

                    @media (orientation:landscape) {
                        .avivid_addfan_page {
                            min-width: 100%;
                            min-height: 100%;
                            position: fixed;
                            left: 0;
                            top: 0;
                            margin: auto;
                            display: flex;
                            background-color: rgba(0, 0, 0, .6);
                            z-index: 2147483645;
                            overflow: auto;
                        }
                        .avivid_addfan_wrapper {
                            position: relative;
                            top: 10vw;
                            left: 20vw;
                            width: 75vw;
                            height: 10vw; 
                        }
                        .avivid_addfan_close {
                            position: relative;
                            top: -43vw;
                            left: 50vw;
                            width: 6vw;
                            z-index: 1000;
                            cursor: pointer;
                        }

                        .avivid_addfan_img_wrapper {
                            position: relative;
                            top: 0vw;
                            width: 50vw;
                            height: 50vw; 
                            border-width: 0;
                            padding: 0;
                        }
                        .avivid_addfan_img {
                            position: relative;
                            left: 0vw;
                            width: 100%;
                            height: 100%; 
                            object-fit: fill;
                            cursor: pointer;
                        }
                        .avivid_addfan_comment {
                                position: absolute;
                                top: 50%;
                                left: 0;
                                transform: translate(0, -50%);
                                padding: 10px;
                                text-align: center;
                                width: 100%;
                                color: black;
                        }
                        .avivid_line_fans_btn_wrapper{
                            position: relative;
                            top: 0.8vw;
                            left: 0.2vw;
                            width: 19vw;
                            height: 4vw;
                            
                        }
                        .avivid_line_fans_btn {
                            position: relative;
                            top: -2vw;
                            left: 6.5vw;
                            width: 50vw;
                            height: 10vw;
                            background-color: ` + AviviD.addFan.ad_btn_color + `;
                            cursor: pointer;
                            display: flex;
                            justify-content: center;
                            align-items: center;

                        }
                        .avivid_addfan_logo {
                            position: absolute;
                            bottom: 5px;
                            right: 5px;
                            width: 50px;
                        }
                        .avivid_addfan_text {
                            font-size: 4vw;
                            font-weight: 700;
                            color: white;
                            margin: 0;
                        }

                        @media (min-width: 700px){
                            .avivid_addfan_close{
                                top: -20vw;
                                left: 45vw;
                                width: 3vw;
                            }
                            .avivid_addfan_img_wrapper {
                                top: -1vw;
                                width: 29vw;
                                height: 37vw;
                                left: 13vw;
                            }
                            .avivid_line_fans_btn_wrapper{
                                position: relative;
                                top: -1vw;
                                left: 16.5vw;
                                width: 29vw;
                                height: 4vw;
                                background: white;
                            }
                            .avivid_line_fans_btn{
                                position: absolute;
                                top: 0.5vw;
                                left: 5vw;
                                width: 20vw;
                                height: 3vw;
                                border: none;
                                border-radius: 5px;
                                box-shadow: 2px 2px 2px 1px rgb(0 0 0 / 20%);
                            }
                            .avivid_line_fans_btn:hover{
                                box-shadow: 0px 0px 21px 10px rgba(97,97,95,0.75);
                            }
                            .avivid_addfan_text{
                                font-size: 1.3vw;
                            }
                            .avivid_addfan_logo{
                                width: 30px;
                            }
                        }

                        @media (min-width: 1400px){
                            .avivid_addfan_close{
                                top: -15.6vw;
                                left: 40vw;
                                width: 2vw;
                            }
                            .avivid_addfan_img_wrapper {
                                top: -2vw;
                                width: 19vw;
                                height: 25vw;
                                left: 19vw;
                            }
                            .avivid_line_fans_btn_wrapper{
                                top: -2.2vw;
                                left: 21.2vw;
                                width: 19vw;
                                height: 4vw;
                            }
                            .avivid_line_fans_btn{
                                top: 0.5vw;
                                left: 1.5vw;
                                width: 16vw;
                                height: 3vw;
                            }
                            .avivid_line_fans_btn:hover{
                                
                            }
                            .avivid_addfan_text{
                                font-size: 1.5vw;
                            }
                        }
                    }
                    </style>
                    `
                    let ad_div =
                        `
                    <div class="avivid_addfan_page" >
                        <div class="avivid_addfan_wrapper"> 
                            <img class="avivid_addfan_close" onclick="AviviD.close_addfan_page()" src="https://rhea-cache.advividnetwork.com/coupon/cancel.svg"></img>
                            <button class="avivid_addfan_img_wrapper" onclick="AviviD.trigger_ad('` + AviviD.addFan.ad_url + `', 1)">
                                <img class="avivid_addfan_img" src="` + AviviD.addFan.ad_image_url + `"></img>
                                <div class = "avivid_addfan_comment" > ` + AviviD.addFan.ad_comment + ` </div>
                            </button>
                            <div class="avivid_line_fans_btn_wrapper">
                                <button class="avivid_line_fans_btn" onclick="AviviD.trigger_af('` + AviviD.addFan.ad_btn_url + `', 1)">
                                    <p class="avivid_addfan_text">` + AviviD.addFan.ad_btn_text + `</p>
                                    <img class="avivid_addfan_logo" src="https://rhea-cache.advividnetwork.com/coupon/AviviD_logo.svg"></img>
                                </button>
                            </div>
                        </div>
                    </div>`
                    jQuery('body').prepend(ad_div);
                    jQuery('head').append(ad_css);
                };
                AviviD.Promotion_ad();
                // cancel onpage

                if (AviviD.likrTimer === undefined) {
                    setTimeout(function () {
                        AviviD.likrTimer.clearTimer();
                    }, 500);
                } else {
                    AviviD.likrTimer.clearTimer();
                }

                // 1. save to cookies
                AviviD.addFan.AviviD_is_addfan_b = 1;
                AviviD.set_cookie_minutes_tracking("AviviD_is_addfan_b", AviviD.addFan.AviviD_is_addfan_b, 60);
                AviviD.set_cookie_minutes_tracking("AviviD_prob_p", AviviD.addFan.AviviD_prob_p, 60);
                // 2. send triggered addFan event
                AviviD.LikrEventTrackingSendAfAd();
            };
        };
    };
    //// A. call API to check coupon status, customer_type(0:all, 1:only new)
    //// B. if coupon status=1, do something, else, do nothing
    //// C. check is_coupon cookies, if customer_type=1 and AviviD.record_user.i_pb=1, do nothing, else do something
    //// D. get coupon model(API)
    //// E. compute probability of purchase
    //// F. get coupon details(API)

    //// disable coupon if Appier coupon show for i3fresh
    if (AviviD.web_id === 'i3fresh') {
        AviviD.set_coupon_disable = function () {
            // 1.set cookie
            AviviD.addFan.AviviD_is_coupon = 0;
            AviviD.addFan.AviviD_is_coupon_b = 1;
            AviviD.addFan.AviviD_c_t_r = 0;
            AviviD.set_cookie_minutes_tracking("AviviD_is_coupon", AviviD.addFan.AviviD_is_coupon, 0.01);
            AviviD.set_cookie_minutes_tracking("AviviD_is_coupon_b", AviviD.addFan.AviviD_is_coupon_b, 1 * 24 * 60);
            AviviD.set_cookie_minutes_tracking("AviviD_c_t_r", AviviD.addFan.AviviD_c_t_r, 0.01);
            // 2.remove coupon
            clearInterval(AviviD.addFan.countInterval);
            jQuery('.avivid_main_page').remove();
            jQuery('#secondary_page').remove();
        };
        //// click coupon link
        jQuery("a.zc_button_link.zc_campaign").click(function (e) {
            console.log(jQuery(".zc_button_link.zc_campaign").is(":visible"));
            AviviD.set_coupon_disable();

        });
        //// click coupon link
        jQuery("div.zc_contents.zc_campaign>img.zc_campaign").click(function (e) {
            console.log(jQuery(".zc_button_link.zc_campaign").is(":visible"));
            AviviD.set_coupon_disable();

        });
        //// click reminding clock
        jQuery("div.zc_badge.zc-hvr-push.zc_campaign.zc_badge_show").click(function (e) {
            console.log(jQuery(".zc_button_link.zc_campaign").is(":visible"));
            AviviD.set_coupon_disable();
        });
    };
    if (AviviD.web_id === 'washcan' || AviviD.web_id === 'hidesan' || AviviD.web_id === 'lzl') {
        function dynamicLoadCss(url) {
            var head = document.getElementsByTagName('head')[0];
            var mycss = document.createElement('link');
            mycss.type = 'text/css';
            mycss.rel = 'stylesheet';
            mycss.href = url;
            head.appendChild(mycss);
        }
        if (1 == 1) {
            dynamicLoadCss(`https://rhea-cache.advividnetwork.com/coupon/custom_css/${AviviD.web_id}/avivid_common.css`);
        }
    }
    if (AviviD.web_id === 'kfan') {
        function dynamicLoadCss(url) {
            var head = document.getElementsByTagName('head')[0];
            var mycss = document.createElement('link');
            mycss.type = 'text/css';
            mycss.rel = 'stylesheet';
            mycss.href = url;
            head.appendChild(mycss);
        }
        if (1 == 1) {
            dynamicLoadCss(`https://rhea-cache.advividnetwork.com/coupon/custom_css/${AviviD.web_id}/avivid_common_kfan.css`);
        }
    }
})()
