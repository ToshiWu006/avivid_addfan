//// should be loaded after event_tracker_gtm.js
//// Rules in https://docs.google.com/document/d/1YFZf0DYqI1XHuRM8teZx5wy_fcAoWfPplVJjUXGb--U/edit?usp=sharing
AviviD.addFan = {};

AviviD.addFan.AviviD_is_coupon = ( AviviD.get_cookie_tracking('AviviD_is_coupon')!=="NaN" ) ? AviviD.get_cookie_tracking('AviviD_is_coupon') : 0;
AviviD.addFan.AviviD_is_coupon_b = ( AviviD.get_cookie_tracking('AviviD_is_coupon_b')!=="NaN" ) ? AviviD.get_cookie_tracking('AviviD_is_coupon_b') : 0;
AviviD.addFan.AviviD_prob_p = ( AviviD.get_cookie_tracking('AviviD_prob_p')!=="NaN" ) ? parseFloat(AviviD.get_cookie_tracking('AviviD_prob_p')) : 0;
AviviD.addFan.AviviD_is_coupon = 1;
AviviD.addFan.AviviD_is_coupon_b = 1;


if (AviviD.addFan.AviviD_is_coupon_b==0 && AviviD.addFan.AviviD_is_coupon==0) {
    //// call API to fetch model parameters
    AviviD.addFan.lower_bound = 0.40;
    AviviD.addFan.upper_bound = 0.817847;
    AviviD.addFan.model_keys = ['ps','t_p_t','c_c_t','i_ac','i_rc'];
    AviviD.addFan.model_parameters = [0.02788,0.00051,-0.00144,3.12283,1.22228];
    AviviD.get_model_X = function(record_user, keys) {
        var values = [];
        for (let i=0; i<keys.length; i++) {
            values.push(record_user[keys[i]]);
        }
        return values;
    }
    AviviD.addFan.model_X = AviviD.get_model_X(AviviD.record_user, AviviD.addFan.model_keys);
    AviviD.addFan.model_intercept = -5.59731;
    AviviD.logistic_equation = function(X, coeff, intercept) {
        var Y = 0;
        for (let i=0; i<X.length; i++) {
            Y += coeff[i]*X[i];    
        }
        Y += intercept;
        var prob = 1/(1+Math.exp(-Y));
        return prob;
    };
    //// compute prob. of purchase
    AviviD.addFan.AviviD_prob_p = AviviD.logistic_equation(AviviD.addFan.model_X, AviviD.addFan.model_parameters, AviviD.addFan.model_intercept); 
    AviviD.addFan.AviviD_prob_p = Number((AviviD.addFan.AviviD_prob_p).toFixed(5));// round to .5f, Number((0.688689).toFixed(5))
    //// check if send coupon next page
    if (AviviD.addFan.AviviD_prob_p >= AviviD.addFan.lower_bound && AviviD.addFan.AviviD_prob_p <= AviviD.addFan.upper_bound){
        //// yes to send. Going to next page within 60 min will send coupon next page successfully
        // 1. save to cookies
        AviviD.addFan.AviviD_is_coupon = 1;
        AviviD.addFan.AviviD_is_coupon_b = 1;
        AviviD.set_cookie_minutes_tracking("AviviD_is_coupon",AviviD.addFan.AviviD_is_coupon,60);
        AviviD.set_cookie_minutes_tracking("AviviD_is_coupon_b",AviviD.addFan.AviviD_is_coupon_b,60);
        AviviD.set_cookie_minutes_tracking("AviviD_prob_p",AviviD.addFan.AviviD_prob_p,60);
        // 2. send triggered sendCoupon event
        // AviviD.LikrEventTrackingSendCoupon()

    } else {
        //// do nothing
    }

} else if (AviviD.addFan.AviviD_is_coupon_b==1 && AviviD.addFan.AviviD_is_coupon==1) { // show coupon
    // 1.call API to fetch coupon information, key: web_id, coupon_enable=1, coupon_delete=0, today>=start_time and today<=end_time
    AviviD.addFan.coupon_title = '雙11耗材限時折扣!!';
    AviviD.addFan.coupon_description = '憑本券購買Coway專用濾網/濾芯組可享有額外100元折扣!!數量有限，用完為止!!';
    AviviD.addFan.coupon_code = "Coway300";
    AviviD.addFan.coupon_setTimer = 60; // 0: no timer, no secondary page
    AviviD.addFan.coupon_type = 2; // 折扣類型 {0:無設定 1:免運 2:元 3:% 4:n送n}
    AviviD.addFan.coupon_amount = 100;
    AviviD.addFan.coupon_customer_type = 0; //0:所有 1:新客
    AviviD.addFan.coupon_code_mode = 0; // 0:單一, 1:批量

    // 2.if 批量code, call API to update is_send accroding to coupon_code

    //// click to clipboard message
    AviviD.addFan.coupon_copy_message = '您的折價卷代碼已複製到剪貼簿';
    AviviD.addFan.coupon_copy_message_css = 
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
            z-index: 9999;
        }
    </style>`;
    AviviD.addFan.coupon_copy_message_div = `<div class='avivid_copy_message'>`+AviviD.addFan.coupon_copy_message+`</div>`;
    jQuery('head').append(AviviD.addFan.coupon_copy_message_css);
    jQuery('body').append(AviviD.addFan.coupon_copy_message_div);
    //// load main for coupon
    AviviD.Promotion_coupons = function(title, content, code, timeset, mode=0){
        var coupon_css =
        `<style>
            @media (orientation:portrait) {
                .main_page{
                    background-color: rgb(0, 0, 0,0.8);
                    min-width: 100%;
                    min-height: 100%;
                    position: fixed;
                    bottom: 0;
                    z-index: 999;
                    /*top: 0;*/
                    overflow: auto;
                    display: none;
                }
                .coupon_position{
                    position: relative;
                    /*bottom: 62px;*/
                    margin: auto;
                    left: 0;
                    right: 0;
                    text-align: center;
                }
                .text_background{
                    /*border: 2px solid white;*/
                    border-bottom-left-radius: 50px;
                    border-bottom-right-radius: 50px;
                    /*min-height: 445px;*/
                    width: 73.3%;
                    /*background-color: white;*/
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
                    height: 10vh;
                    background-color: rgb(0, 0, 0,0.6);
                    left: 3%;
                    border-radius: 13px;
                    display:none;
                    z-index: 999;
                    padding-top: 4vw;
                }
                [class*="col-"] {
                    float: left;
                    padding-right: 6%;
                    padding-top:10%;
                }
                .col-1 {
                    width: 1%;
                    border:2px solid white;
                }
                .col-2 {
                    width: 1%;
                    border:1px solid white;
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
    
                .avivid_coupon_title{
    
                    position: absolute;
                    width: 70vw;
                    height: 25vw;
                    left: 15vw;
                    top: 65vw;
                    
                    font-family: Swei Gothic CJK TC;
                    font-style: normal;
                    font-weight: 1000;
                    font-size: 20px;
                    line-height: 26px;
                    /* or 130% */
                    text-align: center;
                    color: #F78CA0;
    
    
                    /*background: linear-gradient(to bottom,#F78CA0 0%,#F9748F 10%,#FD868C 60%);
                    background: -webkit-linear-gradient(to bottom,#F78CA0 0%,#F9748F 10%,#FD868C 60%);
                    background-clip: text;
                    -webkit-background-clip: text;
                    color: transparent;*/
                }
                .avivid_coupon_description{
                    position: absolute;
                    width: 70vw;
                    height: 47px;
                    left: 15vw;
                    top: 80vw;
                    
                    font-family: Swei Gothic CJK TC;
                    font-style: normal;
                    font-weight: 300;
                    font-size: 15px;
                    line-height: 21px;
                    /* or 140% */
                    text-align: center;
                    
                    color: #606060;
                }
                .avivid_coupon{
                    position: absolute;
                    width: 80vw;
                    height: 15px;
                    left: 10vw;
                    top: 100vw;                
                    font-family: Swei Gothic CJK TC;
                    font-style: normal;
                    font-weight: normal;
                    font-size: 15px;
                    line-height: 15px;
                    text-align: center;                
                    color: #606060;           
    
                }
    
                .avivid_coupon_code{
                    position: absolute;
                    width: 80vw;
                    height: 28px;
                    left: 10vw;
                    top: 105vw;                
                    font-family: Swei Gothic CJK TC;
                    font-style: normal;
                    font-weight: 900;
                    font-size: 28px;
                    line-height: 28px;
                    text-align: center;       
                    
                    color: #606060;            
    
                }
                .avivid_coupon_help{
                    position: absolute;
                    width: 70vw;
                    height: 16px;
                    left: 15vw;
                    top: 116vw;
                    
                    font-family: Swei Gothic CJK TC;
                    font-style: normal;
                    font-weight: 300;
                    font-size: 10px;
                    line-height: 16px;
                    /* identical to box height, or 160% */
                    text-align: center;
                    
                    color: #606060;
                }
    
                .avivid_coupon_sep{
                    position: absolute;
                    width: 70vw;
                    height: 0px;
                    left: 15vw;
                    top: 122vw;
    
                    border: 1px dashed #606060;
                    transform: rotate(0.65deg);
                }
    
                .avivid_coupon_alert{
                    position: absolute;
                    width: 70vw;
                    height: 28px;
                    left: 15vw;
                    top: 124vw;
    
                    font-family: Swei Gothic CJK TC;
                    font-style: normal;
                    font-weight: 300;
                    font-size: 10px;
                    line-height: 14px;
                    /* or 175% */
                    text-align: center;
    
                    color: #606060;
                }
    
                .avivid_coupon_discard{
                    position: absolute;
                    width: 32vw;
                    left: 12vw;
                    top: 140vw;
                }
    
                .avivid_coupon_accept{
                    position: absolute;
                    width: 44vw;
                    left: 39vw;
                    top: 140vw;
                }
                .avivid_coupon_exit{
                    position: absolute;
                    width: 12vw;
                    left: 32vw;
                    top: -3vw;
                }
            }
            @media (orientation:landscape) {
                .main_page{
                    background-color: rgb(0, 0, 0,0.8);
                    min-width: 100%;
                    min-height: 100%;
                    position: fixed;
                    bottom: 0;
                    z-index: 999;
                    /*top: 0;*/
                    overflow: auto;
                }
                .coupon_position{
                    position: relative;
                    /*bottom: 62px;*/
                    margin: auto;
                    left: 0;
                    right: 0;
                    text-align: center;
                }
                .text_background{
                    /*border: 2px solid white;*/
                    border-bottom-left-radius: 50px;
                    border-bottom-right-radius: 50px;
                    /*min-height: 445px;*/
                    width: 73.3%;
                    /*background-color: white;*/
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
                    padding-top: 1vw;
                }
                [class*="col-"] {
                    float: left;
                    padding-right: 6%;
                    padding-top:10%;
                }
                .col-1 {
                    width: 1%;
                    border:2px solid white;
                }
                .col-2 {
                    width: 1%;
                    border:1px solid white;
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
    
                .avivid_coupon_title{
    
                    position: absolute;
                    width: 70vw;
                    height: 25vw;
                    left: 15vw;
                    top: 35vw;
                    
                    font-family: Swei Gothic CJK TC;
                    font-style: normal;
                    font-weight: 1000;
                    font-size: 20px;
                    line-height: 26px;
                    /* or 130% */
                    text-align: center;
                    color: #F78CA0;
    
    
                    /*background: linear-gradient(to bottom,#F78CA0 0%,#F9748F 10%,#FD868C 60%);
                    background: -webkit-linear-gradient(to bottom,#F78CA0 0%,#F9748F 10%,#FD868C 60%);
                    background-clip: text;
                    -webkit-background-clip: text;
                    color: transparent;*/
                }
                .avivid_coupon_description{
                    position: absolute;
                    width: 46vw;
                    height: 47px;
                    left: 27vw;
                    top: 43vw;
                    
                    font-family: Swei Gothic CJK TC;
                    font-style: normal;
                    font-weight: 300;
                    font-size: 15px;
                    line-height: 21px;
                    /* or 140% */
                    text-align: center;
                    
                    color: #606060;
                }
                .avivid_coupon{
                    position: absolute;
                    width: 80vw;
                    height: 15px;
                    left: 10vw;
                    top: 53vw;                
                    font-family: Swei Gothic CJK TC;
                    font-style: normal;
                    font-weight: normal;
                    font-size: 15px;
                    line-height: 15px;
                    text-align: center;                
                    color: #606060;           
    
                }
    
                .avivid_coupon_code{
                    position: absolute;
                    width: 40vw;
                    height: 28px;
                    left: 30vw;
                    top: 56vw;                
                    font-family: Swei Gothic CJK TC;
                    font-style: normal;
                    font-weight: 900;
                    font-size: 28px;
                    line-height: 28px;
                    text-align: center;       
                    
                    color: #606060;            
    
                }
                .avivid_coupon_help{
                    position: absolute;
                    width: 40vw;
                    height: 16px;
                    left: 30vw;
                    top: 65vw;
                    
                    font-family: Swei Gothic CJK TC;
                    font-style: normal;
                    font-weight: 300;
                    font-size: 10px;
                    line-height: 16px;
                    /* identical to box height, or 160% */
                    text-align: center;
                    
                    color: #606060;
                }
    
                .avivid_coupon_sep{
                    position: absolute;
                    width: 40vw;
                    height: 0px;
                    left: 30vw;
                    top: 69vw;
                    border: 1px dashed #606060;
                    transform: rotate(0.65deg);
                }
    
                .avivid_coupon_alert{
                    position: absolute;
                    width: 40vw;
                    height: 28px;
                    left: 30vw;
                    top: 71vw;
    
                    font-family: Swei Gothic CJK TC;
                    font-style: normal;
                    font-weight: 300;
                    font-size: 10px;
                    line-height: 14px;
                    /* or 175% */
                    text-align: center;
    
                    color: #606060;
                }
    
                .avivid_coupon_discard{
                    position: absolute;
                    width: 19vw;
                    left: 27vw;
                    top: 80vw;
                }
    
                .avivid_coupon_accept{
                    position: absolute;
                    width: 26vw;
                    left: 45vw;
                    top: 80vw;
                }
                .avivid_coupon_exit{
                    position: absolute;
                    width: 7vw;
                    left: 13.5vw;
                    top: -2vw;
                }
            }
        </style>`
    
        var main = 
        `   
            <div class = 'main_page'>
                <div class = 'coupon_position'>
                    <img src="https://rhea-cache.advividnetwork.com/coupon/Frame_40.png" class = "coupon_backgroud">          
                    
                    <div class='avivid_coupon_title'>
                        <div>`+title+`</div>
                        <div>(`+timeset+`mins)</div>
                    </div>
                    <div class='avivid_coupon_description'>`+content+`</div>
                    <div class='avivid_coupon'>優惠碼</div>
                    <div class='avivid_coupon_code'>`+code+`</div>
                    <div class='avivid_coupon_help'>請在購物車頁面「請輸入優惠碼」中輸入以上折扣代碼</div>
                    <div class='avivid_coupon_sep'></div>
                
                    <div class='avivid_coupon_alert'>
                        <span>．限時30分鐘內結帳使用</span>                        
                        <span>．折扣碼數量有限欲完為止</span>                        
                        <span>．折扣碼每人限使用一次</span>                        
                        <span>．每筆訂單限使用一組折扣碼</span>                        
                        <span>．若有訂單退貨，折扣碼金額將一併扣除，不予補發</span>
                    </div>
                    <div id = 'main_reciprocal' style = 'margin-bottom: 55px;display:none;'>
                        <span>優惠倒數：</span>
                        <span id ='count-down-timer'></span>                        
                        <div style = 'position: relative;left: 9%;'>
                            <span countdown = '10' class="col-1" style = 'border-top-left-radius:500px;border-bottom-left-radius:500px;background-color: #FEA285;'></span>
                            <span countdown = '9' class="col-1" style="background-color: #FDA682;"></span>
                            <span countdown = '8' class="col-1" style="background-color: #FCAF7D;"></span>
                            <span countdown = '7' class="col-1" style="background-color: #FBB877;"></span>
                            <span countdown = '6' class="col-1" style="background-color: #FBB778;"></span>
                            <span countdown = '5' class="col-1" style="background-color: #FABC74;"></span>
                            <span countdown = '4' class="col-1" style="background-color: #F9C072;"></span>
                            <span countdown = '3' class="col-1" style="background-color: #F9C56F;"></span>
                            <span countdown = '2' class="col-1" style="background-color: #F9D26F;"></span>
                            <span countdown = '1' class="col-1" style = 'border-top-right-radius:500px;border-bottom-right-radius:500px;background-color: #FFE37E;'></span>
                        </div>
                    </div>
                    <div style = 'display: flex;'>
                        <div id = 'avivid_coupon_discard_button' class='avivid_coupon_discard' onclick = 'AviviD.RemoveCoupon()'>                        
                            <img src = 'https://rhea-cache.advividnetwork.com/coupon/Frame_18.png' style = 'width: 55%;'>                            
                        </div>
                        <div id = 'avivid_coupon_accept_button' class='avivid_coupon_accept' onclick = 'AviviD.AcceptCoupon()'>                        
                            <img src = 'https://rhea-cache.advividnetwork.com/coupon/Frame_5.png' style = 'width: 100%;'>
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
                <div id = 'secondary_reciprocal' style = 'margin-left: 17px;display:none'>
                    <span countdown1 = '10' class="col-2" style = 'border-top-left-radius:500px;border-bottom-left-radius:500px;background-color: #FEA285;'></span>
                    <span countdown1 = '9' class="col-2" style="background-color: #FDA682;"></span>
                    <span countdown1 = '8' class="col-2" style="background-color: #FCAF7D;"></span>
                    <span countdown1 = '7' class="col-2" style="background-color: #FBB877;"></span>
                    <span countdown1 = '6' class="col-2" style="background-color: #FBB778;"></span>
                    <span countdown1 = '5' class="col-2" style="background-color: #FABC74;"></span>
                    <span countdown1 = '4' class="col-2" style="background-color: #F9C072;"></span>
                    <span countdown1 = '3' class="col-2" style="background-color: #F9C56F;"></span>
                    <span countdown1 = '2' class="col-2" style="background-color: #F9D26F;"></span>
                    <span countdown1 = '1' class="col-2" style='border-top-right-radius:500px;border-bottom-right-radius:500px;background-color: #FFE37E;'></span>
                </div>
            </div>
        `;
        jQuery('head').append(coupon_css);
        jQuery('body').append(main);
        if (mode==1) {
            //// go to next page or click multiple times at the same page, hide main page, show secondary page
            AviviD.AcceptCoupon(false); // option to disable clickToClipboard

        } else {
            //// first time to accept coupon, show main page, hide secondary page
            jQuery('.main_page').show();

        }
    }


    AviviD.ClickToClipboard = function(text){
        //// Copy the text inside the text field 
        navigator.clipboard.writeText(text);
        console.log("copy text: " + text);
        jQuery('.avivid_copy_message').fadeIn(100).fadeOut(1500);
    };
    // padding 0 if num<10, ex: 1 => 01
    AviviD.paddedFormat = function(num){
        return num < 10 ? "0" + num : num; 
    }
    AviviD.startCountDown = function(){
        // AviviD.addFan.AviviD_c_t_r = typeof(AviviD.addFan.AviviD_c_t_r)==='undefined' ? duration : AviviD.addFan.AviviD_c_t_r;
        // AviviD.addFan.AviviD_c_t_r
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
            }
            AviviD.addFan.AviviD_c_t_r--
            //// end of counter and coupon
            if (AviviD.addFan.AviviD_c_t_r <= 0) { 
                // 1.clear counter
                clearInterval(AviviD.addFan.countInterval);
                // 2.remove counter UI
                jQuery('.main_page').remove();
                jQuery('#secondary_page').remove();
                // 3.clear and reset cookies
                AviviD.addFan.AviviD_is_coupon = 0;
                AviviD.addFan.AviviD_is_coupon_b = 1;
                AviviD.addFan.AviviD_c_t_r = 0;
                AviviD.set_cookie_minutes_tracking("AviviD_is_coupon",AviviD.addFan.AviviD_is_coupon,0.01);
                AviviD.set_cookie_minutes_tracking("AviviD_is_coupon_b",AviviD.addFan.AviviD_is_coupon_b,28*24*60);
                AviviD.set_cookie_minutes_tracking("AviviD_c_t_r",AviviD.addFan.AviviD_c_t_r,0.1);
            };
        }, 1000);    
    }
    AviviD.sleep = function(ms) {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve();
            }, ms);
        });
    }
    AviviD.AcceptCoupon = function(click_mode=true){
        //// initialize for AviviD.startCountDown()
        AviviD.addFan.AviviD_c_t_r = typeof(AviviD.addFan.AviviD_c_t_r)==='undefined' ? 60*AviviD.addFan.coupon_setTimer : AviviD.addFan.AviviD_c_t_r;
        AviviD.addFan.AviviD_c_t_r_min = typeof(AviviD.addFan.AviviD_c_t_r_min)==='undefined' ? AviviD.addFan.coupon_setTimer : AviviD.addFan.AviviD_c_t_r_min;
        AviviD.addFan.AviviD_c_t_r_sec = typeof(AviviD.addFan.AviviD_c_t_r_sec)==='undefined' ? 0 : AviviD.addFan.AviviD_c_t_r_sec;
        //// check if trigger sendCoupon event
        if (AviviD.addFan.AviviD_c_t_r==60*AviviD.addFan.coupon_setTimer) { // first time to accept
            // 1.send triggered acceptCoupon event
            // AviviD.LikrEventTrackingAcceptCoupon()
            console.log('trigger acceptCoupon event')            
        } else {
            // do nothing
        }
        //// copy coupon code to clipboard
        if (click_mode) {
            AviviD.ClickToClipboard(AviviD.addFan.coupon_code);
        }
        //// for timer=0 setting
        if (AviviD.addFan.coupon_setTimer==0) {// no timer setting
            jQuery('.main_page').hide();                
        } else { // show secondary page and timer
            setTimeout(()=>{
                jQuery('.main_page').hide();
                jQuery('#secondary_page').show();
                jQuery('#receive_button').attr('onclick', 'AviviD.show_secondary_page()');
                jQuery('#main_reciprocal').show();
                jQuery('#secondary_reciprocal').show();    
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
                                })
                            })
                        })
                    })
                })    
            },800);
        }
                
    }

    
    AviviD.show_main_page = function(){
        jQuery('.main_page').show();
        jQuery('#secondary_page').hide();
        jQuery('#main_reciprocal').hide(); 
    }
    AviviD.show_secondary_page = function(){
        jQuery('.main_page').hide();
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
                            })
                        })
                    })
                })
            })
        })
    }   

    
    //// for discard coupon-2
    AviviD.RemoveCoupon = function(){
        // 1.set cookie
        AviviD.addFan.AviviD_is_coupon = 0;
        AviviD.addFan.AviviD_is_coupon_b = 1;
        AviviD.addFan.AviviD_c_t_r = 0;
        AviviD.set_cookie_minutes_tracking("AviviD_is_coupon",AviviD.addFan.AviviD_is_coupon,0.01);
        AviviD.set_cookie_minutes_tracking("AviviD_is_coupon_b",AviviD.addFan.AviviD_is_coupon_b,28*24*60);
        AviviD.set_cookie_minutes_tracking("AviviD_c_t_r",AviviD.addFan.AviviD_c_t_r,0.1);
        // 2.remove coupon
        clearInterval(AviviD.addFan.countInterval);
        jQuery('.main_page').remove();
        jQuery('#secondary_page').remove();
        // 3.send triggered discardCoupon event
        // AviviD.LikrEventTrackingDiscardCoupon()
        console.log('trigger discardCoupon event')

    }

    //// to record coupon time remaining
    window.addEventListener(AviviD.event.leave, function (e) {
        if (AviviD.addFan.AviviD_is_coupon===1 && typeof(AviviD.addFan.AviviD_c_t_r)!=='undefined'){
            //// save coupon remaining time(s)
            AviviD.set_cookie_minutes_tracking("AviviD_c_t_r",AviviD.addFan.AviviD_c_t_r,AviviD.addFan.AviviD_c_t_r/60);
            console.log('save coupon timer remaining time to cookie')
        }
    });

    //// check AviviD_c_t_r(coupon time remaining)
    AviviD.addFan.AviviD_c_t_r = ( AviviD.get_cookie_tracking('AviviD_c_t_r')!="NaN" ) ? parseInt(AviviD.get_cookie_tracking('AviviD_c_t_r')) : AviviD.addFan.AviviD_c_t_r;
    if (typeof(AviviD.addFan.AviviD_c_t_r)==='undefined') {
        //// first time to accept coupon      
        // 1.show coupon
        AviviD.Promotion_coupons(AviviD.addFan.coupon_title, AviviD.addFan.coupon_description, AviviD.addFan.coupon_code, AviviD.addFan.coupon_setTimer, 0);
        // 2.to record trigger

    } else {
        //// time remaining >= 0, next page or click multiple times at one page case
        // 1.directly show secondary page
        AviviD.Promotion_coupons(AviviD.addFan.coupon_title, AviviD.addFan.coupon_description, AviviD.addFan.coupon_code, AviviD.addFan.coupon_setTimer, 1);
    }
} else {
    //// do nothing (trival case)
}

AviviD.LikrEventTrackingSendCoupon = function(){
    let ga_id = ( AviviD.get_cookie_tracking('_ga')!="NaN" ) ? AviviD.get_cookie_tracking('_ga') : AviviD.get_cookie_tracking('gaClientId');
    let uuid = AviviD.get_cookie_tracking('AviviD_uuid');
    let fb_id = AviviD.get_cookie_tracking('_fbp');
    let coupon_info = {
        "p_p"   : AviviD.addFan.AviviD_prob_p,
        "c_t"   : AviviD.addFan.coupon_title,
        "c_d"   : AviviD.addFan.coupon_description,
        "c_c"  : AviviD.addFan.coupon_code,
        "c_st"  : AviviD.addFan.coupon_setTimer,
        "c_ty"  : AviviD.addFan.coupon_type,
        "c_a"   : AviviD.addFan.coupon_amount,
        "c_c_t" : AviviD.addFan.coupon_customer_type,
        "c_c_m" : AviviD.addFan.coupon_code_mode,
    }
    let tracking_data = {
        'web_id'            : AviviD.web_id,
        'uuid'              : uuid,
        'ga_id'             : ga_id,
        'fb_id'             : fb_id,
        'timestamp'         : Date.now(),
        "behavior_type"     : "likrTracking",
        'event_type'        : "sendCoupon",
        "coupon"            : AviviD.is_coupon,
        'record_user'       : AviviD.record_user,
        "coupon_info"       : coupon_info,
    };
    //// don't send if in preview mode
    if (~AviviD.get_urlparam('avivid_preview_coupon')) {
        AviviD.tracking_data_aws_put.construct(tracking_data);
    }
};

AviviD.LikrEventTrackingAcceptCoupon = function(){
    let ga_id = ( AviviD.get_cookie_tracking('_ga')!="NaN" ) ? AviviD.get_cookie_tracking('_ga') : AviviD.get_cookie_tracking('gaClientId');
    let uuid = AviviD.get_cookie_tracking('AviviD_uuid');
    let fb_id = AviviD.get_cookie_tracking('_fbp');
    let coupon_info = {
        "p_p"   : AviviD.addFan.AviviD_prob_p,
        "c_t"   : AviviD.addFan.coupon_title,
        "c_d"   : AviviD.addFan.coupon_description,
        "c_c"  : AviviD.addFan.coupon_code,
        "c_st"  : AviviD.addFan.coupon_setTimer,
        "c_ty"  : AviviD.addFan.coupon_type,
        "c_a"   : AviviD.addFan.coupon_amount,
        "c_c_t" : AviviD.addFan.coupon_customer_type,
        "c_c_m" : AviviD.addFan.coupon_code_mode,
    }
    let tracking_data = {
        'web_id'            : AviviD.web_id,
        'uuid'              : uuid,
        'ga_id'             : ga_id,
        'fb_id'             : fb_id,
        'timestamp'         : Date.now(),
        "behavior_type"     : "likrTracking",
        'event_type'        : "acceptCoupon",
        "coupon"            : AviviD.is_coupon,
        'record_user'       : AviviD.record_user,
        "coupon_info"       : coupon_info,
    };
    //// don't send if in preview mode
    if (~AviviD.get_urlparam('avivid_preview_coupon')) {
        AviviD.tracking_data_aws_put.construct(tracking_data);
    }
};

AviviD.LikrEventTrackingDiscardCoupon = function(){
    let ga_id = ( AviviD.get_cookie_tracking('_ga')!="NaN" ) ? AviviD.get_cookie_tracking('_ga') : AviviD.get_cookie_tracking('gaClientId');
    let uuid = AviviD.get_cookie_tracking('AviviD_uuid');
    let fb_id = AviviD.get_cookie_tracking('_fbp');
    let coupon_info = {
        "p_p"   : AviviD.addFan.AviviD_prob_p,
        "c_t"   : AviviD.addFan.coupon_title,
        "c_d"   : AviviD.addFan.coupon_description,
        "c_c"  : AviviD.addFan.coupon_code,
        "c_st"  : AviviD.addFan.coupon_setTimer,
        "c_ty"  : AviviD.addFan.coupon_type,
        "c_a"   : AviviD.addFan.coupon_amount,
        "c_c_t" : AviviD.addFan.coupon_customer_type,
        "c_c_m" : AviviD.addFan.coupon_code_mode,
    }
    let tracking_data = {
        'web_id'            : AviviD.web_id,
        'uuid'              : uuid,
        'ga_id'             : ga_id,
        'fb_id'             : fb_id,
        'timestamp'         : Date.now(),
        "behavior_type"     : "likrTracking",
        'event_type'        : "discardCoupon",
        "coupon"            : AviviD.is_coupon,
        'record_user'       : AviviD.record_user,
        "coupon_info"       : coupon_info,
    };
    //// don't send if in preview mode
    if (~AviviD.get_urlparam('avivid_preview_coupon')) {
        AviviD.tracking_data_aws_put.construct(tracking_data);
    }
};




// jQuery('#avivid_coupon_accept_button').on(AviviD.event.down_event, function(e) {
//     console.log("trigger acceptCoupon");
//     AviviD.LikrEventTrackingAcceptCoupon();
// });

// jQuery('#avivid_coupon_discard_button').on(AviviD.event.down_event, function(e) {
//     console.log("trigger discardCoupon");
//     AviviD.LikrEventTrackingDiscardCoupon();
// });