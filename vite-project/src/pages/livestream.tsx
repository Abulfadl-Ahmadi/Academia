export default function LiveStream() {
    return (
        <>
            <style>
                {`.r1_iframe_embed {position: relative; overflow: hidden; width: 100%; height: auto; padding-top: 56.25%; } .r1_iframe_embed iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0; }`}
            </style>
            <div className="r1_iframe_embed">
                <iframe
                    src="https://player.arvancloud.ir/index.html?config=https://abulfadl.arvanlive.ir/geometry3s03/origin_config.json"
                    style={{ border: "0 #ffffff none" }}
                    name="جلسه صفرم | کلاس سالیانه هندسه ۳"
                    frameBorder="0"
                    allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen={true}
                    webkitallowfullscreen="true"
                    mozallowfullscreen="true"
                ></iframe>
            </div>
        </>
    )
}