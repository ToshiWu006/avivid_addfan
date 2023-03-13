(async function(){
    AviviD = typeof(AviviD) == 'undefined'? {} : AviviD;

    var AwsTrackingFunction=function(){
        // @todo put tracking data endpoint to aws
        data_stream_name = "elephant";
        sdk_src = "https://avivid.likr.tw/sample/aws-sdk-min.js";
        region_ = "ap-southeast-1";
        identity_pool_id = "ap-southeast-1:f46698d9-24cf-4242-8a3d-8707f45d1cfd";
        AviviD.tracking_data_aws_put = {
            debug_mode: 0,
            /** Based Setting START **/
            sdkSrc: sdk_src,
            region: region_, // 區域
            IdentityPoolId: identity_pool_id, //Cognito Pool Id
            dataStreamName: data_stream_name, // data stream名稱
            kinesis: '',
            credentialsStatus: false,
            errorFlag: false,
            errorMsg: '',
            /** Based Setting END **/
            /** Method START **/
            /**
             * @todo 檢查aws sdk有無載入並執行主程式
             * @param {Object} tracking_data
             */
            construct: function (tracking_data) {
                if (typeof (AviviD_AWS) == 'undefined') {
                    //console.log('執行aws sdk載入');
                    var script = document.createElement('script');
                    script.src = this.sdkSrc;
                    document.head.appendChild(script);
                    script.onload = function () {
                        //console.log('aws sdk載入完畢');
                        AviviD.tracking_data_aws_put.main(tracking_data);
                    };
                } else {
                    AviviD.tracking_data_aws_put.main(tracking_data);
                }
            },
            /**
             * @todo 主程式workflow
             * @param {Object} tracking_data
             */
            main: function (tracking_data) {
                /** CHECKING DEBUG MODE **/
                if(window.location.href.indexOf('AviviD_debug_mode=1') != -1 || AviviD.category_id=='20200703000003'){
                    this.debug_mode=1;
                }
                /** Step1 確認認證狀況 若沒有就執行認證 **/
                if (!this.credentialsStatus) {
                    //console.log('執行aws 認證');
                    this.credentials_init();
                }
                /** Step2 確認kinesis初始化狀況 若無則執行初始化 **/
                if (this.kinesis == '') {
                    //console.log('執行aws kinesis初始化');
                    this.kinesis = new AviviD_AWS.Kinesis();
                }
                /** Step3 執行資料處理 **/
                //console.log('執行aws kinesis params處理');
                data_prepared = this.prepare_data(tracking_data);
                // if(this.debug_mode == 1){
                //     console.log('The Data before putting in kinesis datastream:');
                //     console.log(data_prepared);
                // }
                /** Step4 Put資料 **/
                //console.log('執行aws kinesis params put');
                this.kinesit_put_data(data_prepared);
            },
            /**
             * @todo aws認證
             */
            credentials_init: function () {
                AviviD_AWS.config.region = this.region; // 區域
                ai = 'AKIATBR2IINU2ISIXU72';
                sa = 'FDEVKX8o7qNAS15wWQGgjDXeLti2NC8xEuhM/y7d';
                AviviD_AWS.config.credentials = new AviviD_AWS.Credentials(ai, sa, sessionToken = null);
                AviviD_AWS.config.maxRetries = 5;
                AviviD_AWS.config.credentials.get(function (err) {
                    if (err) { //如果認證錯誤
                        console.error(err);
                        AviviD.tracking_data_aws_put.errorFlag = true;
                        AviviD.tracking_data_aws_put.errorMsg = err;
                        if(AviviD.tracking_data_aws_put.debug_mode==1){
                            $.ajax({
                                type:'POST',
                                url:'https://likrbackupserver.likr.com.tw/gtm_seo_client/log/recordLog.php',
                                dataType:'json',
                                data:{
                                    'value':JSON.stringify(AviviD.tracking_data_aws_put.errorMsg)+'認證失敗'
                                }
                            });
                        }
                        return;
                    } else { //認證通過
                        AviviD.tracking_data_aws_put.credentialsStatus = true;
                        AviviD.tracking_data_aws_put.errorFlag = false;
                        AviviD.tracking_data_aws_put.errorMsg = '';
                        return;
                    }
                });
            },
            /**
             * @todo put data to kinesis
             * @param {Object} params
             */
            kinesit_put_data: function (params) {
                this.kinesis.putRecord(params, function (err, data) {
                    if (err) {
                        AviviD.tracking_data_aws_put.errorFlag = true;
                        AviviD.tracking_data_aws_put.errorMsg = err;
                        if(AviviD.tracking_data_aws_put.debug_mode==1 && params.Data.indexOf('AviviD_test_20210111') != -1){
                            $.ajax({
                                type:'POST',
                                url:'https://likrbackupserver.likr.com.tw/gtm_seo_client/log/recordLog.php',
                                dataType:'json',
                                data:{
                                    'value':JSON.stringify(AviviD.tracking_data_aws_put.errorMsg)+'送資料失敗'
                                }
                            });
                        }
                        return;
                    } else {
                        AviviD.tracking_data_aws_put.errorFlag = false;
                        AviviD.tracking_data_aws_put.errorMsg = '';
                        if(AviviD.tracking_data_aws_put.debug_mode==1 && params.Data.indexOf('AviviD_test_20210111') != -1){
                            $.ajax({
                                type:'POST',
                                url:'https://likrbackupserver.likr.com.tw/gtm_seo_client/log/recordLog.php',
                                dataType:'json',
                                data:{
                                    'value':JSON.stringify(data)+'送資料成功'
                                }
                            });
                        }
                        return;
                    }
                });
            },
            /**
             * @todo data formate/prepare
             * @param {Object} tracking_data
             */
            prepare_data: function (tracking_data) {
                return {
                    Data: JSON.stringify(tracking_data),
                    PartitionKey: this.uuid_generate(),
                    StreamName: this.dataStreamName,
                };
            },
            // prepare_data: function (tracking_data) {
            //     return {
            //         DeliveryStreamName: 'tapir_firehose',
            //         Record: {
            //             Data: JSON.stringify(tracking_data)
            //         }
            //     };
            // },
            /**
             * @todo dataStream's uuid gen
             * @param {Object} tracking_data
             */
            uuid_generate: function () {
                var d = Date.now();
                if (typeof performance !== 'undefined' && typeof performance.now == 'function') {
                    d += performance.now(); //use high-precision timer if available
                }
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                    var r = (d + Math.random() * 16) % 16 | 0;
                    d = Math.floor(d / 16);
                    return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                });
            }
            /** Method END **/
        }
    }
    AwsTrackingFunction()


    AviviD.get_cookie_tracking = function(cookie_name="AviviD_session_id") {
        let arr = document.cookie.match(new RegExp("(^| )" + cookie_name + "=([^;]*)(;|$)"));
        if (arr != null) {
            return decodeURI(arr[2]);
        };
        return "NaN";
    };
    AviviD.get_feature_domain = function(url) {
        let domain = (url!=="" ? new URL(url).hostname : "");
        let isIP = /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/.test(domain);
        if (isIP) return domain;
        let domain_split_array = domain.split('.');
        let length = domain_split_array.length;
        // let domain_split_reverse = domain.split('.').reverse();
        if (length <= '2') {
            return domain;
        } else if (length == '3') {
            if (domain_split_array[1] == 'com') {
                return domain;
            } else {
                domain_split_array.shift(); //remove first element
            };
        } else if (length == '4') {
            if (domain_split_array[3] == 'com') {
                domain_split_array.shift(); //remove first element
                domain_split_array.shift(); //remove first element
            } else {
                domain_split_array.shift(); //remove first element
            };
        } else {
            domain_split_array.shift(); //remove first element
        };
        return domain_split_array.join('.');
    };
    AviviD.set_cookie_minutes_tracking = function(name, value, minutes) {
        var domain = AviviD.get_feature_domain(location.href);
        var Mins = minutes || 60;
        var exp = new Date();
        exp.setTime(exp.getTime() + Mins * 60 * 1000);
        document.cookie = name + "=" + encodeURI(value) + ";expires=" + exp.toUTCString() + ";domain=" + domain + ";path=/;secure;";
    };

    AviviD.get_urlparam = function(name) {
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
        var r = window.location.search.substr(1).match(reg);
        if (r != null) return unescape(r[2]);
        return null;
    }
 

    //// API to give the all coupons
    AviviD.fetch_coupon_status_all = async function(web_id) {
        return new Promise((resolve, reject) => {
            let url = 'https://rhea-cache.advividnetwork.com/api/coupon/status_all'; // https://rhea-cache.advividnetwork.com/api/
            jQuery.ajax({
                type: 'GET',
                url: url,
                cache: true,
                dataType: 'json',
                data: {
                    'web_id': web_id
                },
                success: function (result) {
                    // resolve(result)
                    result_modify = []
                    for (i=0;i<result.length;i++) {
                        let coupon_limit = result[i]['coupon_limit'].split('limit-bill=')[1];
                        result[i]['coupon_limit'] = coupon_limit===undefined ? 0 : parseInt(coupon_limit);
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


    //// API to give coupon details (use coupon id)
    AviviD.fetch_addFan_coupon_detials = async function(coupon_id) {
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

    //// API to give update coupon is_send status (use coupon id and coupon code)
    AviviD.update_addFan_coupon_is_send = async function(link_code, coupon_code) {
        return new Promise((resolve, reject) => {
            let url = 'https://rhea-cache.advividnetwork.com/api/coupon/batchStatus'; // https://rhea-cache.advividnetwork.com/api/
            jQuery.ajax({
                type: 'POST',
                url: url,
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

    AviviD.LikrEventTrackingAcceptCoupon = function(){
        let ga_id = ( AviviD.get_cookie_tracking('_ga')!="NaN" ) ? AviviD.get_cookie_tracking('_ga') : AviviD.get_cookie_tracking('gaClientId');
        let uuid = (AviviD.web_uuid === undefined || AviviD.web_uuid === "_") ? AviviD.get_cookie_tracking('AviviD_uuid') : AviviD.web_uuid;
        let fb_id = AviviD.get_cookie_tracking('_fbp');
        let ip = (AviviD.clientIP===undefined) ? "_" : AviviD.clientIP;
        let is_coupon = ( AviviD.get_cookie_tracking('AviviD_is_coupon')!=="NaN" ) ? AviviD.get_cookie_tracking('AviviD_is_coupon') : 0;
        let coupon_info = {
            "p_p"   : AviviD.addFan.AviviD_prob_p,
            "c_t"   : AviviD.addFan.coupon_title,
            "c_d"   : AviviD.addFan.coupon_description,
            "c_c"   : AviviD.addFan.coupon_code,
            "c_st"  : AviviD.addFan.coupon_setTimer,
            "c_ty"  : AviviD.addFan.coupon_type,
            "c_a"   : AviviD.addFan.coupon_amount,
            "c_c_t" : AviviD.addFan.coupon_customer_type,
            "c_c_m" : AviviD.addFan.coupon_code_mode,
            "l_c"   : AviviD.addFan.link_code,
            "c_i"   : AviviD.addFan.coupon_id,
            "w_t"   : AviviD.addFan.website_type,
        };
        let tracking_data = {
            'web_id'            : AviviD.web_id,
            'uuid'              : uuid,
            'ga_id'             : ga_id,
            'fb_id'             : fb_id,
            'ip'                : ip,
            'timestamp'         : Date.now(),
            "behavior_type"     : "likrTracking",
            'event_type'        : "acceptCoupon",
            "coupon"            : is_coupon,
            'record_user'       : AviviD.record_user,
            "coupon_info"       : coupon_info,
        };
        //// don't send if in preview mode
        if (AviviD.get_urlparam('avivid_preview_coupon')!=1) {
            AviviD.tracking_data_aws_put.construct(tracking_data);
            console.log("trigger acceptCoupon event");
        };
    };

    AviviD.LikrEventTrackingDiscardCoupon = function(){
        let ga_id = ( AviviD.get_cookie_tracking('_ga')!="NaN" ) ? AviviD.get_cookie_tracking('_ga') : AviviD.get_cookie_tracking('gaClientId');
        let uuid = (AviviD.web_uuid === undefined || AviviD.web_uuid === "_") ? AviviD.get_cookie_tracking('AviviD_uuid') : AviviD.web_uuid;
        let fb_id = AviviD.get_cookie_tracking('_fbp');
        let ip = (AviviD.clientIP===undefined) ? "_" : AviviD.clientIP;
        let is_coupon = ( AviviD.get_cookie_tracking('AviviD_is_coupon')!=="NaN" ) ? AviviD.get_cookie_tracking('AviviD_is_coupon') : 0;
        let coupon_info = {
            "p_p"   : AviviD.addFan.AviviD_prob_p,
            "c_t"   : AviviD.addFan.coupon_title,
            "c_d"   : AviviD.addFan.coupon_description,
            "c_c"   : AviviD.addFan.coupon_code,
            "c_st"  : AviviD.addFan.coupon_setTimer,
            "c_ty"  : AviviD.addFan.coupon_type,
            "c_a"   : AviviD.addFan.coupon_amount,
            "c_c_t" : AviviD.addFan.coupon_customer_type,
            "c_c_m" : AviviD.addFan.coupon_code_mode,
            "l_c"   : AviviD.addFan.link_code,
            "c_i"   : AviviD.addFan.coupon_id,
            "w_t"   : AviviD.addFan.website_type,
        };
        let tracking_data = {
            'web_id'            : AviviD.web_id,
            'uuid'              : uuid,
            'ga_id'             : ga_id,
            'fb_id'             : fb_id,
            'ip'                : ip,
            'timestamp'         : Date.now(),
            "behavior_type"     : "likrTracking",
            'event_type'        : "discardCoupon",
            "coupon"            : is_coupon,
            'record_user'       : AviviD.record_user,
            "coupon_info"       : coupon_info,
        };
        //// don't send if in preview mode
        if (AviviD.get_urlparam('avivid_preview_coupon')!=1) {
            AviviD.tracking_data_aws_put.construct(tracking_data);
            console.log("trigger discardCoupon event");
        };
    };

    AviviD.addFan = typeof(AviviD.addFan) == 'undefined'? {} : AviviD.addFan;
    //// A. call API to check coupon status, customer_type(0:all, 1:only new)
    // var data_status_array = await AviviD.fetch_coupon_status_all('rick');
    var data_status_array = await AviviD.fetch_coupon_status_all(AviviD.web_id);
    // 1(new),2(old),99(exit),4,5
    var data_status_array_filter = data_status_array.filter(x => x.customer_type===99);

    if (data_status_array_filter.length===0) {
        var data_status = {status: false};
    } else {
        //// choose index of coupon according to AviviD.updated_cart_price
        var index_coupon = 0;
        var data_status = data_status_array_filter[index_coupon];
    };

    AviviD.addFan.coupon_status = (AviviD.get_urlparam('avivid_preview_coupon')==1)? true : data_status.status; // false: no available coupon, true: yes or preview mode
    AviviD.addFan.coupon_id = data_status.id; // use to get coupon information
    AviviD.addFan.coupon_customer_type = data_status.customer_type; // 0: all, 1: new only (exclude is_purchase_brfore=1), 2: old only
    AviviD.addFan.website_type = data_status.website_type; // 0:normal, 1: one-page ecom
    AviviD.addFan.coupon_limit = data_status.coupon_limit;
    AviviD.addFan.coupon_setTimer = data_status.coupon_time_limit; // 0: no timer, no secondary page

    if (AviviD.get_urlparam('avivid_preview_coupon')==1) {
        AviviD.addFan.coupon_status = true;
    }
    // check coupon status, get coupon only when AviviD_is_coupon_b==0
    if (AviviD.addFan.coupon_status) { // coupon enable
        AviviD.addFan.AviviD_is_coupon_b = ( AviviD.get_cookie_tracking('AviviD_is_coupon_b')!=="NaN" ) ? parseInt(AviviD.get_cookie_tracking('AviviD_is_coupon_b')) : 0;
        AviviD.addFan.AviviD_is_coupon = ( AviviD.addFan.AviviD_is_coupon_b==0 ) ? 1 : 0;
        if (AviviD.get_urlparam('avivid_preview_coupon')==1) {
            //// force to show coupon
            AviviD.addFan.AviviD_is_coupon = 1;
            AviviD.addFan.AviviD_is_coupon_b = 0;
            // assing parameters in preview-mode
            AviviD.addFan.coupon_id = (AviviD.get_urlparam('coupon_id')) ? parseInt(AviviD.get_urlparam('coupon_id')) : AviviD.addFan.coupon_id;
            AviviD.addFan.coupon_customer_type = (AviviD.get_urlparam('coupon_customer_type')) ? parseInt(AviviD.get_urlparam('coupon_customer_type')) : AviviD.addFan.coupon_customer_type;
            AviviD.addFan.website_type = (AviviD.get_urlparam('website_type')) ? parseInt(AviviD.get_urlparam('website_type')) : AviviD.addFan.website_type;
            AviviD.addFan.coupon_limit = (AviviD.get_urlparam('coupon_limit')) ? parseInt(AviviD.get_urlparam('coupon_limit')) : AviviD.addFan.coupon_limit;
        };

        //// F. get coupon details(API)
        if (AviviD.addFan.AviviD_is_coupon_b==0 && AviviD.addFan.AviviD_is_coupon==1) { // show coupon both 1 (do not show when AviviD_is_coupon==2)
            // 1.call API to fetch coupon information, key: web_id, coupon_enable=1, coupon_delete=0, today>=start_time and today<=end_time
            var coupon_details = await AviviD.fetch_addFan_coupon_detials(AviviD.addFan.coupon_id);
            AviviD.addFan.coupon_title = coupon_details.title;
            AviviD.addFan.coupon_description = coupon_details.coupon_description;
            AviviD.addFan.coupon_code = coupon_details.coupon_code; // if no coupon to send, return null
            AviviD.addFan.coupon_setTimer = coupon_details.coupon_time_limit; // 0: no timer, no secondary page
            AviviD.addFan.coupon_type = coupon_details.coupon_type; // 折扣類型 {0:無設定 1:免運 2:元 3:% 4:n送n}
            AviviD.addFan.coupon_amount = coupon_details.coupon_amount;
            AviviD.addFan.coupon_code_mode = coupon_details.coupon_code_mode; // 0:單一, 1:批量
            AviviD.addFan.link_code = coupon_details.link_code; // link code to join two tables
            AviviD.addFan.coupon_limit = coupon_details.coupon_limit; // limit- amount,limit-account,limit-order,limit-return,limit-bill=1000
            AviviD.addFan.coupon_url = coupon_details.coupon_url; //open link when accept btn click
            // 2.if 批量code, call API to update is_send accroding to coupon_code
            if (AviviD.addFan.coupon_code_mode==1) {
                AviviD.update_addFan_coupon_is_send(AviviD.addFan.link_code, AviviD.addFan.coupon_code);
            };            
            if (AviviD.addFan.coupon_code!==null) { // send coupon if coupon_code exist
                //// click to clipboard message
                AviviD.clickToClipboard_info = function(){
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
                    let coupon_copy_message_div = `<div class='avivid_copy_message'>`+coupon_copy_message+`</div>`;
                    jQuery('head').append(coupon_copy_message_css);
                    jQuery('body').append(coupon_copy_message_div);
                };
                AviviD.clickToClipboard_info();

                AviviD.appendCouponLimit = function(coupon_limit){
                    var alert_div_1 = `<span>．折扣碼每人限領一次</span>`
                    var alert_div_2 = `<span>．每筆訂單限使用一組折扣碼</span>`
                    var alert_div_3 = `<span>．若有訂單退貨，優惠金額將一併扣除，不予退款</span>`
                    var alert_div_4 = `<span style="font-weight:bold;">．最低金額消費需達到`
                    var coupon_limit_array = coupon_limit.split(',');
                    for (let i=0; i<coupon_limit_array.length; i++) {
                        let limit = coupon_limit_array[i];
                        if (limit==='limit-account') {
                            jQuery('.avivid_coupon_alert').append(alert_div_1)
                        } else if (limit==='limit-order') {
                            jQuery('.avivid_coupon_alert').append(alert_div_2);
                        } else if (limit==='limit-return') {
                            jQuery('.avivid_coupon_alert').append(alert_div_3);
                        } else if (limit.includes('limit-bill')) {
                            let limit_bill = limit.split('=')[1];
                            alert_div_4 += limit_bill + `元</span>`;
                            jQuery('.avivid_coupon_alert').append(alert_div_4);
                        };
                    };    
                };

                //// load main for coupon
                AviviD.Promotion_coupons = function(title, content, code, timeset, limit, mode=0){
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
                            display: none;
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
                            background: url('https://rhea-cache.advividnetwork.com/coupon/Frame_40.png');
                            background-repeat: no-repeat;
                            width: 100vw;
                            height: 65vw;
                            background-size: 90%;
                            background-position: top center;
                        }
                        .avivid_coupon_content_wraper{
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            background: #fff;
                            width: 80.7vw;
                            margin-left: 0.5vw;
                            padding: 0 5vw 20px 5vw;
                            border-radius: 0 0 30px 30px;
                            box-shadow: 0px 0px 10px 0px rgb(255 255 255 / 50%);
                            box-sizing: border-box;
                            position: relative;
                            top: -1px;
                        }

                        .avivid_coupon_title{             
                            font-family: Swei Gothic CJK TC;
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
                                font-size: 18px;
                            }
                        }
                        @media only screen and (max-width: 350px) {
                            .avivid_coupon_title  {
                                font-size: 17px;
                            }
                        }
                        .avivid_coupon_description{
                            font-family: Swei Gothic CJK TC;
                            font-style: normal;
                            font-weight: 300;
                            font-size: 15px;
                            line-height: 21px;
                            /* or 140% */
                            text-align: center;
                            color: #606060;
                            margin: 1vh 0;
                            display: -webkit-box;
                            -webkit-line-clamp: 6;
                            -webkit-box-orient: vertical;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        }
                        @media only screen and (max-width: 400px) {
                            .avivid_coupon_description  {
                                font-size: 15px;
                            }
                        }
                        .avivid_coupon_description_locked{
                            font-size: 17px;
                            margin: 40px 0;
                        }
                        .avivid_coupon{         
                            font-family: Swei Gothic CJK TC;
                            font-style: normal;
                            font-weight: normal;
                            font-size: 15px;
                            line-height: 15px;
                            text-align: center;                
                            color: #606060;           
                            margin-top: 2vh;
                        }
                        .avivid_coupon_code{       
                            font-family: Swei Gothic CJK TC;
                            font-style: normal;
                            font-weight: 900;
                            font-size: 28px;
                            line-height: 28px;
                            text-align: center;           
                            color: #606060;            
                            margin: 5px 0;
                        }
                        .avivid_coupon_help{
                            font-family: Swei Gothic CJK TC;
                            font-style: normal;
                            font-weight: 300;
                            font-size: 10px;
                            line-height: 16px;
                            /* identical to box height, or 160% */
                            text-align: center;      
                            color: #606060;
                            margin: 1vh 0;
                        }
                        @media only screen and (max-width: 400px) {
                            .avivid_coupon{
     
                            }
                            .avivid_coupon_code{
                
                            }
                            .avivid_coupon_help{

                            }
                        }
                        .avivid_coupon_sep{

                            width: 70vw;
                            height: 0px;

                            border: 1px dashed #606060;
                        }
                        .avivid_coupon_alert{

                            font-family: Swei Gothic CJK TC;
                            font-style: normal;
                            font-weight: 300;
                            font-size: 10px;
                            line-height: 14px;
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
                    }
                    @media (orientation:landscape) {
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
                            background: url('https://rhea-cache.advividnetwork.com/coupon/Frame_40.png');
                            background-repeat: no-repeat;
                            width: 100vw;
                            height: 65vw;
                            background-size: 90%;
                            background-position: top center;
                        }
                        .avivid_coupon_content_wraper{
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            background: #fff;
                            width: 80.65vw;
                            margin-left: 0.3vw;
                            padding: 0 5vw 20px 5vw;
                            border-radius: 0 0 30px 30px;
                            box-shadow: 0px 0px 10px 0px rgb(255 255 255 / 50%);
                            box-sizing: border-box;
                            position: relative;
                            top: -1px;
                        }
                        .avivid_coupon_title{

                            font-family: Swei Gothic CJK TC;
                            font-style: normal;
                            font-weight: 1000;
                            font-size: 20px;
                            line-height: 26px;
                            /* or 130% */
                            text-align: center;
                            color: #F78CA0;
                        }
                        .avivid_coupon_description{

                            font-family: Swei Gothic CJK TC;
                            font-style: normal;
                            font-weight: 300;
                            font-size: 15px;
                            line-height: 21px;
                            /* or 140% */
                            text-align: center;
                            color: #606060;
                            margin: 1vh 0;
                            display: -webkit-box;
                            -webkit-line-clamp: 6;
                            -webkit-box-orient: vertical;
                            overflow: hidden;
                            text-overflow: ellipsis;
                        }
                        .avivid_coupon_description_locked{
                            font-size: 17px;
                            margin: 40px 0;
                        }
                        .avivid_coupon{
           
                            font-family: Swei Gothic CJK TC;
                            font-style: normal;
                            font-weight: normal;
                            font-size: 15px;
                            line-height: 15px;
                            text-align: center;                
                            color: #606060;           
                            margin-top: 2vh;
                        }
                        .avivid_coupon_code{
      
                            font-family: Swei Gothic CJK TC;
                            font-style: normal;
                            font-weight: 900;
                            font-size: 28px;
                            line-height: 28px;
                            text-align: center;       
                            color: #606060;            
                            margin: 5px 0;
                        }
                        .avivid_coupon_help{

                            font-family: Swei Gothic CJK TC;
                            font-style: normal;
                            font-weight: 300;
                            font-size: 10px;
                            line-height: 16px;
                            /* identical to box height, or 160% */
                            text-align: center;
                            color: #606060;
                            margin: 1vh 0;
                        }
                        .avivid_coupon_sep{

                            width: 40vw;

                            border: 1px dashed #606060;
                        }
                        .avivid_coupon_alert{

                            font-family: Swei Gothic CJK TC;
                            font-style: normal;
                            font-weight: 300;
                            font-size: 10px;
                            line-height: 14px;
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
                    }
                </style>`;

                    var main_div = 
                    `   
                        <div class = 'avivid_main_page'>
                            <div class = 'coupon_position'>
                                <div class='avivid_coupon_cap'></div>
                                <div class='avivid_coupon_content_wraper'>
                                    <div class='avivid_coupon_title'>
                                        <div>`+title+`</div>
                                    </div>
                                    <div class='avivid_coupon_description'>`+content+`</div>
                                    <div class='avivid_coupon'>優惠碼</div>
                                    <div class='avivid_coupon_code'>`+code+`</div>
                                    <div class='avivid_coupon_help'>請在購物車頁面「請輸入優惠碼」中輸入以上折扣代碼</div>
                                    <div class='avivid_coupon_sep'></div>
                                    <div class='avivid_coupon_alert'></div>     
                                    <div class='avivid_coupon_btns' style = 'display: flex;width: 100%;justify-content: space-around;'>
                                        <div id = 'avivid_coupon_discard_button' class='avivid_coupon_discard' onclick = 'AviviD.RemoveCoupon()'>                        
                                            <img src = 'https://rhea-cache.advividnetwork.com/coupon/Frame_18.png' style = 'width: 100%;'>                            
                                        </div>
                                        <div id = 'avivid_coupon_accept_button' class='avivid_coupon_accept' onclick = 'AviviD.AcceptCoupon()'>                        
                                            <img src = 'https://rhea-cache.advividnetwork.com/coupon/Frame_5.png' style = 'width: 100%;'>
                                        </div> 
                                    </div>               
                                </div>
                            </div>            
                        </div>
                        
                        <div id = 'secondary_page' onclick = 'AviviD.show_main_page()'>
                            <div class='avivid_coupon_exit' onclick = 'AviviD.RemoveCoupon()'>
                                <img src = 'https://rhea-cache.advividnetwork.com/coupon/XIcon.png' style = 'width: 50%;'>
                            </div>
                            <div style = 'text-align: center;padding: 6px;display: grid;'>
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
                    var time_limit_div = `<div>(`+timeset+` mins)</div>`;

                    jQuery('head').append(coupon_css);
                    jQuery('body').append(main_div);
                    if (AviviD.addFan.coupon_code_mode===3 || AviviD.addFan.coupon_url!=="_") {// url-type coupon
                        jQuery('.avivid_coupon_description').addClass('avivid_coupon_description_locked');
                        jQuery('.avivid_coupon, .avivid_coupon_code, .avivid_coupon_help').addClass('hidden');
                    };
                    //// append coupon_limit if existing
                    AviviD.appendCouponLimit(limit);
                    // AviviD.update_couponUI();
                    if (timeset!=0) { // 限時
                        jQuery('.avivid_coupon_title').append(time_limit_div);
                    };
                    if (mode==1) { // 小鬧鐘
                        //// go to next page or click multiple times at the same page, hide main page, show secondary page
                        AviviD.AcceptCoupon(false); // option to disable clickToClipboard        
                    } else { // 折價卷主視窗
                        //// first time to accept coupon, show main page, hide secondary page
                        jQuery('.avivid_main_page').show();        
                    };
                };

                AviviD.ClickToClipboard = function(text){
                    //// Copy the text inside the text field 
                    navigator.clipboard.writeText(text);
                    console.log("copy text: " + text);
                    jQuery('.avivid_copy_message').fadeIn(100).fadeOut(1500);
                };
                // padding 0 if num<10, ex: 1 => 01
                AviviD.paddedFormat = function(num){
                    return num < 10 ? "0" + num : num; 
                };
                AviviD.startCountDown = function(){
                    let secondsprogress = (AviviD.addFan.AviviD_c_t_r+1) / 10;
                    let originsec = AviviD.addFan.AviviD_c_t_r+1;
                    let i = 1;
                    var element = document.querySelector('#count-down-timer2');
                    clearInterval(AviviD.addFan.countInterval); // clear old setInterval to prevent multiple counting
                    AviviD.addFan.countInterval = setInterval(function () {
                        //// update timer
                        AviviD.addFan.AviviD_c_t_r_min = parseInt(AviviD.addFan.AviviD_c_t_r / 60);
                        AviviD.addFan.AviviD_c_t_r_sec = parseInt(AviviD.addFan.AviviD_c_t_r % 60);        
                        element.innerHTML = AviviD.paddedFormat(AviviD.addFan.AviviD_c_t_r_min) + ':' + AviviD.paddedFormat(AviviD.addFan.AviviD_c_t_r_sec);    
                        if((originsec - secondsprogress * i) <  AviviD.addFan.AviviD_c_t_r){            
                            jQuery('span[countdown='+i+']').addClass('blink');
                            jQuery('span[countdown1='+i+']').addClass('blink');
                        }else{            
                            jQuery('span[countdown='+i+']').removeClass('blink');
                            jQuery('span[countdown='+i+']').css('background-color', '#C5C7C9');
                            jQuery('span[countdown1='+i+']').removeClass('blink');
                            jQuery('span[countdown1='+i+']').css('background-color', 'rgb(113 113 113)');
                            i ++;
                        };
                        AviviD.addFan.AviviD_c_t_r--;
                        //// end of counter and coupon, should in counting mode (AviviD_is_coupon==1, !=2)
                        if (AviviD.addFan.AviviD_c_t_r <= 0 && AviviD.addFan.AviviD_is_coupon==1) { 
                            // 1.clear counter
                            clearInterval(AviviD.addFan.countInterval);
                            // 2.remove counter UI
                            jQuery('.avivid_main_page').remove();
                            jQuery('#secondary_page').remove();
                            // 3.clear and reset cookies
                            AviviD.addFan.AviviD_is_coupon = 0;
                            AviviD.addFan.AviviD_is_coupon_b = 1;
                            AviviD.addFan.AviviD_c_t_r = 0;
                            AviviD.set_cookie_minutes_tracking("AviviD_is_coupon",AviviD.addFan.AviviD_is_coupon,0.01);
                            AviviD.set_cookie_minutes_tracking("AviviD_is_coupon_b",AviviD.addFan.AviviD_is_coupon_b,1*24*60);
                            AviviD.set_cookie_minutes_tracking("AviviD_c_t_r",AviviD.addFan.AviviD_c_t_r,0.1);
                        };
                    }, 1000);    
                };
                AviviD.sleep = function(ms) {
                    return new Promise(resolve => {
                        setTimeout(() => {
                            resolve();
                        }, ms);
                    });
                };
                AviviD.AcceptCoupon = function(click_mode=true){
                    //// change cookie when without time limit
                    if (AviviD.addFan.coupon_setTimer==0) { // without time limit setting
                        AviviD.addFan.AviviD_is_coupon = 2;
                        AviviD.addFan.AviviD_is_coupon_b = 1;
                        AviviD.addFan.coupon_accept = 1;
                        AviviD.set_cookie_minutes_tracking("AviviD_is_coupon",AviviD.addFan.AviviD_is_coupon,30); // continue session
                        AviviD.set_cookie_minutes_tracking("AviviD_is_coupon_b",AviviD.addFan.AviviD_is_coupon_b,1*24*60);
                        jQuery('.avivid_main_page').hide();
                        AviviD.LikrEventTrackingAcceptCoupon();
                    } else { // with time limit                        
                        //// initialize for AviviD.startCountDown()
                        AviviD.addFan.AviviD_c_t_r = typeof(AviviD.addFan.AviviD_c_t_r)==='undefined' ? 60*AviviD.addFan.coupon_setTimer : AviviD.addFan.AviviD_c_t_r;
                        AviviD.addFan.AviviD_c_t_r_min = typeof(AviviD.addFan.AviviD_c_t_r_min)==='undefined' ? AviviD.addFan.coupon_setTimer : AviviD.addFan.AviviD_c_t_r_min;
                        AviviD.addFan.AviviD_c_t_r_sec = typeof(AviviD.addFan.AviviD_c_t_r_sec)==='undefined' ? 0 : AviviD.addFan.AviviD_c_t_r_sec;
                        AviviD.set_cookie_minutes_tracking("AviviD_c_t_r",AviviD.addFan.AviviD_c_t_r,AviviD.addFan.AviviD_c_t_r/60);
                        //// check if trigger sendCoupon event
                        if (AviviD.addFan.AviviD_c_t_r==60*AviviD.addFan.coupon_setTimer) { // first time to accept
                            // 1.send triggered acceptCoupon event
                            AviviD.LikrEventTrackingAcceptCoupon();
                        };
                        // show secondary page and timer
                        setTimeout(()=>{
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
                        },800);
                    };
                    //// copy coupon code to clipboard
                    if (click_mode) {
                        AviviD.ClickToClipboard(AviviD.addFan.coupon_code);
                        if(AviviD.addFan.coupon_url != '_' && AviviD.addFan.coupon_url != undefined){//open new tab if coupon url is set
                            window.open(AviviD.addFan.coupon_url, '_blank');
                        };
                    };
                    // if(AviviD.addFan.coupon_url != '_' && AviviD.addFan.coupon_url != undefined){//open new tab if coupon url is set
                    //     window.open(AviviD.addFan.coupon_url, '_blank')
                    // };
                };

                AviviD.show_main_page = function(){
                    jQuery('.avivid_main_page').show();
                    jQuery('#secondary_page').hide();
                };
                AviviD.show_secondary_page = function(){
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
                AviviD.RemoveCoupon = function(){
                    // 1.set cookie
                    AviviD.addFan.AviviD_is_coupon = 0;
                    AviviD.addFan.AviviD_is_coupon_b = 1;
                    AviviD.addFan.AviviD_c_t_r = 0;
                    AviviD.addFan.coupon_discard = 1;
                    AviviD.set_cookie_minutes_tracking("AviviD_is_coupon",AviviD.addFan.AviviD_is_coupon,0.01);
                    AviviD.set_cookie_minutes_tracking("AviviD_is_coupon_b",AviviD.addFan.AviviD_is_coupon_b,1*24*60);
                    AviviD.set_cookie_minutes_tracking("AviviD_c_t_r",AviviD.addFan.AviviD_c_t_r,0.01);
                    // 2.remove coupon
                    clearInterval(AviviD.addFan.countInterval);
                    jQuery('.avivid_main_page').remove();
                    jQuery('#secondary_page').remove();
                    // 3.send triggered discardCoupon event
                    AviviD.LikrEventTrackingDiscardCoupon();
                };

                if (AviviD.platform_int===2 | AviviD.platform_int==3) {
                    AviviD.event.leave = "pagehide"
                } else {
                    AviviD.event.leave = "beforeunload"
                };
                //// to record coupon time remaining
                window.addEventListener(AviviD.event.leave, function (e) {
                    // AviviD.set_cookie_minutes_tracking("AviviD_is_coupon",AviviD.addFan.AviviD_is_coupon,30);
                    if (AviviD.get_cookie_tracking('AviviD_is_coupon')!="NaN"){ // cookie exitsting, continue refresh cookie for tracking
                        AviviD.set_cookie_minutes_tracking("AviviD_is_coupon",AviviD.addFan.AviviD_is_coupon,30);
                    };
                    if (AviviD.addFan.AviviD_is_coupon===1 && typeof(AviviD.addFan.AviviD_c_t_r)!=='undefined'){ // counting mode
                        AviviD.set_cookie_minutes_tracking("AviviD_c_t_r",AviviD.addFan.AviviD_c_t_r,AviviD.addFan.AviviD_c_t_r/60);
                        console.log('save coupon timer remaining time to cookie');
                    };
                });

                //// check AviviD_c_t_r(coupon time remaining) and initialize AviviD.addFan.AviviD_c_t_r when in counting mode
                AviviD.addFan.AviviD_c_t_r = ( AviviD.get_cookie_tracking('AviviD_c_t_r')!="NaN" ) ? parseInt(AviviD.get_cookie_tracking('AviviD_c_t_r')) : AviviD.addFan.AviviD_c_t_r;
                if (typeof(AviviD.addFan.AviviD_c_t_r)==='undefined') {
                    //// first time to accept coupon
                    // 1.show coupon (main page)
                    AviviD.Promotion_coupons(AviviD.addFan.coupon_title, AviviD.addFan.coupon_description, AviviD.addFan.coupon_code, AviviD.addFan.coupon_setTimer, AviviD.addFan.coupon_limit, 0);
                    // let discardCoupon event as coupon impression
                    AviviD.LikrEventTrackingDiscardCoupon();
                    // if (AviviD.check_addfan_rules()) {
                    //     AviviD.Promotion_coupons(AviviD.addFan.coupon_title, AviviD.addFan.coupon_description, AviviD.addFan.coupon_code, AviviD.addFan.coupon_setTimer, AviviD.addFan.coupon_limit, 0);
                    // }
                } else {
                    //// time remaining >= 0, next page or click multiple times at one page case
                    // 1.directly show secondary page
                    AviviD.Promotion_coupons(AviviD.addFan.coupon_title, AviviD.addFan.coupon_description, AviviD.addFan.coupon_code, AviviD.addFan.coupon_setTimer, AviviD.addFan.coupon_limit, 1);        
                };
                // AviviD.update_couponUI();
            }; //// check coupon_code is not null
        };
    } else { //do nothing
        console.log('no avilable coupon');
    };
    //// API to give the highest prioity ad ranked by remaining days
    AviviD.fetch_ad_status = async function(web_id) {
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
    AviviD.fetch_ad_status_all = async function(web_id) {
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
    AviviD.check_allow_addfan = function() {
        if (AviviD.get_urlparam('avivid_preview_afad')==1) {
            //// force to show addfan
            return true;
        } else {
            AviviD.addFan.AviviD_is_addfan_b = ( AviviD.get_cookie_tracking('AviviD_is_addfan_b')!=="NaN" ) ? parseInt(AviviD.get_cookie_tracking('AviviD_is_addfan_b')) : 0;
            return AviviD.addFan.AviviD_is_addfan_b===0;
        };
    };

    //// 1. check available ad, if not sending coupon
    //// coupon and addfan can only choose one
    if (AviviD.check_allow_addfan()) {
        // var ad_status_array = await AviviD.fetch_ad_status_all('rick');
        var ad_status_array = await AviviD.fetch_ad_status_all(AviviD.web_id);
        var ad_status_array_filter = ad_status_array.filter(x => x.customer_type===99);
        if (ad_status_array_filter.length===0) {
            var ad_status = {status: false};
        } else {
            //// choose index of coupon according to AviviD.updated_cart_price
            var ad_status = ad_status_array_filter[0];
        };

        AviviD.addFan.ad_status = ad_status.status; // 0: no available ad, 1: yes
        AviviD.addFan.ad_id = ad_status.id; // use to get ad information
        AviviD.addFan.website_type = ad_status.website_type; // 0:normal, 1: one-page ecom
        if (AviviD.get_urlparam('avivid_preview_afad')==1) {
            //// force to show coupon
            AviviD.addFan.AviviD_is_addfan_b = 0;
            AviviD.addFan.ad_status = true;
            AviviD.addFan.ad_id = (AviviD.get_urlparam('ad_id')) ? parseInt(AviviD.get_urlparam('ad_id')) : AviviD.addFan.ad_id;
        } else {
            //// normal case
            AviviD.addFan.AviviD_is_addfan_b = ( AviviD.get_cookie_tracking('AviviD_is_addfan_b')!=="NaN" ) ? parseInt(AviviD.get_cookie_tracking('AviviD_is_addfan_b')) : 0;
        };
        //// 2. call addfan_ad if ad_status=1, AviviD_is_addfan_b=0
        if (AviviD.addFan.ad_status && AviviD.addFan.AviviD_is_addfan_b==0) {

            //// API to give ad details (use ad id)
            AviviD.fetch_addFan_ad_detials = async function(ad_id) {
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
            // AviviD.LikrEventTrackingSendAfAd = function(){
            //     let ga_id = ( AviviD.get_cookie_tracking('_ga')!="NaN" ) ? AviviD.get_cookie_tracking('_ga') : AviviD.get_cookie_tracking('gaClientId');
            //     let uuid = AviviD.get_cookie_tracking('AviviD_uuid');
            //     let fb_id = AviviD.get_cookie_tracking('_fbp');
            //     let ip = (AviviD.clientIP===undefined) ? "_" : AviviD.clientIP;
            //     let is_coupon = ( AviviD.get_cookie_tracking('AviviD_is_coupon')!=="NaN" ) ? AviviD.get_cookie_tracking('AviviD_is_coupon') : 0;
            //     let afad_info = {
            //         "p_p"   : AviviD.addFan.AviviD_prob_p,
            //         "l_b"   : AviviD.addFan.lower_bound,
            //         "u_b"   : AviviD.addFan.upper_bound,
            //         "m_k"   : AviviD.addFan.model_keys,
            //         "m_p"   : AviviD.addFan.model_parameters,
            //         "m_i"   : AviviD.addFan.model_intercept,
            //         "m_X"   : AviviD.addFan.model_X,
            //         "a_i"   : AviviD.addFan.ad_id,
            //         "w_t"   : AviviD.addFan.website_type,
            //     };
            //     let tracking_data = {
            //         'web_id'            : AviviD.web_id,
            //         'uuid'              : uuid,
            //         'ga_id'             : ga_id,
            //         'fb_id'             : fb_id,
            //         'ip'                : ip,
            //         'timestamp'         : Date.now(),
            //         "behavior_type"     : "likrTracking",
            //         'event_type'        : "sendAfAd",
            //         "coupon"            : is_coupon,
            //         'record_user'       : AviviD.record_user,
            //         "afad_info"         : afad_info,
            //     };
            //     //// don't send if in preview mode
            //     if (AviviD.get_urlparam('avivid_preview_afad')!=1) {
            //         AviviD.tracking_data_aws_put.construct(tracking_data);
            //         console.log("trigger sendAfAd event");
            //     };
            // };
        
            // AviviD.LikrEventTrackingAcceptAd = function(){
            //     let ga_id = ( AviviD.get_cookie_tracking('_ga')!="NaN" ) ? AviviD.get_cookie_tracking('_ga') : AviviD.get_cookie_tracking('gaClientId');
            //     let uuid = AviviD.get_cookie_tracking('AviviD_uuid');
            //     let fb_id = AviviD.get_cookie_tracking('_fbp');
            //     let ip = (AviviD.clientIP===undefined) ? "_" : AviviD.clientIP;
            //     let is_coupon = ( AviviD.get_cookie_tracking('AviviD_is_coupon')!=="NaN" ) ? AviviD.get_cookie_tracking('AviviD_is_coupon') : 0;
            //     let afad_info = {
            //         "l_b"   : AviviD.addFan.lower_bound,
            //         "p_p"   : AviviD.addFan.AviviD_prob_p,
            //         "a_i"   : AviviD.addFan.ad_id,
            //         "w_t"   : AviviD.addFan.website_type,
        
            //     };
            //     let tracking_data = {
            //         'web_id'            : AviviD.web_id,
            //         'uuid'              : uuid,
            //         'ga_id'             : ga_id,
            //         'fb_id'             : fb_id,
            //         'ip'                : ip,
            //         'timestamp'         : Date.now(),
            //         "behavior_type"     : "likrTracking",
            //         'event_type'        : "acceptAd",
            //         "coupon"            : is_coupon,
            //         'record_user'       : AviviD.record_user,
            //         "afad_info"         : afad_info,
            //     };
            //     //// don't send if in preview mode
            //     if (AviviD.get_urlparam('avivid_preview_afad')!=1) {
            //         AviviD.tracking_data_aws_put.construct(tracking_data);
            //         console.log("trigger acceptAd event");
            //     };
            // };
        
            AviviD.LikrEventTrackingAcceptAf = function(){
                let uuid = AviviD.get_cookie_tracking('AviviD_uuid');
                let is_coupon = ( AviviD.get_cookie_tracking('AviviD_is_coupon')!=="NaN" ) ? AviviD.get_cookie_tracking('AviviD_is_coupon') : 0;
                let afad_info = {
                    "l_b"   : 0,
                    "p_p"   : 0,
                    "a_i"   : AviviD.addFan.ad_id,
                    "w_t"   : AviviD.addFan.website_type,
        
                };
                let tracking_data = {
                    'web_id'            : AviviD.web_id,
                    'uuid'              : uuid,
                    'ga_id'             : '_',
                    'fb_id'             : '_',
                    'ip'                : '_',
                    'timestamp'         : Date.now(),
                    "behavior_type"     : "likrTracking",
                    'event_type'        : "acceptAf",
                    "coupon"            : is_coupon,
                    'record_user'       : AviviD.record_user,
                    "afad_info"         : afad_info,
                };
                //// don't send if in preview mode
                if (AviviD.get_urlparam('avivid_preview_afad')!=1) {
                    AviviD.tracking_data_aws_put.construct(tracking_data);
                    console.log("trigger acceptAf event");
                };
            };
        
            AviviD.LikrEventTrackingDiscardAfAd = function(){
                let uuid = AviviD.get_cookie_tracking('AviviD_uuid');
                let is_coupon = ( AviviD.get_cookie_tracking('AviviD_is_coupon')!=="NaN" ) ? AviviD.get_cookie_tracking('AviviD_is_coupon') : 0;
                let afad_info = {
                    "p_p"   : 0,
                    "a_i"   : AviviD.addFan.ad_id,
                    "w_t"   : AviviD.addFan.website_type,
                };
                let tracking_data = {
                    'web_id'            : AviviD.web_id,
                    'uuid'              : uuid,
                    'ga_id'             : '_',
                    'fb_id'             : '_',
                    'ip'                : '_',
                    'timestamp'         : Date.now(),
                    "behavior_type"     : "likrTracking",
                    'event_type'        : "discardAfAd",
                    "coupon"            : is_coupon,
                    'record_user'       : AviviD.record_user,
                    "afad_info"         : afad_info,
                };
                //// don't send if in preview mode
                if (AviviD.get_urlparam('avivid_preview_afad')!=1) {
                    AviviD.tracking_data_aws_put.construct(tracking_data);
                    console.log("trigger discardAfAd event");
                };
            };
            var ad_details = await AviviD.fetch_addFan_ad_detials(AviviD.addFan.ad_id);
            AviviD.addFan.ad_image_url = ad_details.ad_image_url; // image to display
            AviviD.addFan.ad_url = ad_details.ad_url; // url to redirect when click image
            AviviD.addFan.ad_btn_url = ad_details.ad_btn_url; // url to redirect when click button
            AviviD.addFan.ad_btn_text = ad_details.ad_btn_text; // button text to display
            AviviD.addFan.ad_btn_color = ad_details.ad_btn_color; // button color
            AviviD.onclick_redirect = function(url, mode=0) { // 0:clicking a link, 1:open new tab               
                (mode===0) ? window.location.href(url) : window.open(url, '_blank');
                jQuery(".avivid_addfan_page").hide(500);
            };
            AviviD.trigger_ad = function(url) { // 0:clicking a link, 1:open new tab       
                // AviviD.LikrEventTrackingAcceptAd();
                window.open(url, '_blank');
                jQuery(".avivid_addfan_page").hide(500);
            };
            AviviD.trigger_af = function(url) { // 0:clicking a link, 1:open new tab       
                AviviD.LikrEventTrackingAcceptAf();
                AviviD.addFan.af_accept = 1;
                window.open(url, '_blank');
                jQuery(".avivid_addfan_page").hide(500);
            };
            AviviD.close_addfan_page = function() {
                AviviD.LikrEventTrackingDiscardAfAd();
                jQuery(".avivid_addfan_page").remove();
            };
            AviviD.Promotion_ad = function() {
                let ad_css = 
                `
                <style>
                @media (orientation:portrait) {
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
                        z-index: 999;
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
                        object-fit: cover;
                        cursor: pointer;
                    }
                    .avivid_line_fans_btn {
                        position: relative;
                        top: -2vw;
                        width: 75vw;
                        height: 15vw;
                        background-color: `+AviviD.addFan.ad_btn_color+`;
                        cursor: pointer;

                    }
                    .avivid_logo {
                        position: relative;
                        top: 1vw;
                        left: 30vw;
                    }
                    .avivid_addfan_text {
                        position: relative;
                        top: 2vw;
                        font-size: 5vw;
                        font-weight: 700;
                        color: white;
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
                        z-index: 999;
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
                        object-fit: cover;
                        cursor: pointer;
                    }
                    .avivid_line_fans_btn {
                        position: relative;
                        top: -2vw;
                        left: 6.5vw;
                        width: 50vw;
                        height: 10vw;
                        background-color: `+AviviD.addFan.ad_btn_color+`;
                        cursor: pointer;

                    }
                    .avivid_logo {
                        position: relative;
                        top: 1vw;
                        left: 21vw;
                    }
                    .avivid_addfan_text {
                        position: relative;
                        top: 2vw;
                        font-size: 4vw;
                        font-weight: 700;
                        color: white;
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
                        </button>
                        <button class="avivid_line_fans_btn" onclick="AviviD.trigger_af('` + AviviD.addFan.ad_btn_url + `', 1)">
                            <p class="avivid_addfan_text">`+AviviD.addFan.ad_btn_text+`</p>
                            <img class="avivid_logo" src="https://rhea-cache.advividnetwork.com/coupon/AviviD_logo.svg"></img>
                        </button>
                    </div>
                </div>`
                $('body').prepend(ad_div);
                $('head').append(ad_css);
            };
            AviviD.Promotion_ad();
            // 1. save to cookies
            AviviD.addFan.AviviD_is_addfan_b = 1;
            AviviD.set_cookie_minutes_tracking("AviviD_is_addfan_b",AviviD.addFan.AviviD_is_addfan_b,60);
            // AviviD.set_cookie_minutes_tracking("AviviD_prob_p",AviviD.addFan.AviviD_prob_p,60);
            // 2. send triggered addFan event
            // AviviD.LikrEventTrackingSendAfAd();
        };
    };
    //// A. call API to check coupon status, customer_type(0:all, 1:only new)
    //// B. if coupon status=1, do something, else, do nothing
    //// C. check is_coupon cookies, if customer_type=1 and AviviD.record_user.i_pb=1, do nothing, else do something
    //// D. get coupon model(API)
    //// E. compute probability of purchase
    //// F. get coupon details(API)

  
})()