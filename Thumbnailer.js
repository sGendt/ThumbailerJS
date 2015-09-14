var Thumbnailer = function(width, height, quality, crop, bkg)
{
    this.canvas = document.createElement('canvas');
    this.context =  this.canvas.getContext('2d');

    this.width = (width) ? width : 100;
    this.height = (height) ? height : 100;

    this.crop = (typeof crop == 'undefined') ? true : crop;
    this.bkg = (bkg) ? bkg : '#fff';

    this.quality = (quality) ? quality : 70;

    this.img =  null;
    this.target = null;

    this.saveInfos = 
    {
        'state': false,
        'uri' : '/',
        'callback': function(){},
        'data': {}
    }

    this.init();
}


Thumbnailer.prototype.init = function()
{ 
    console.log('debug mobile: before init');
    var box = document.createElement('div');
    box.id = 'thumbnailerbox';
    box.style.display = 'none';
    document.querySelector('body').appendChild(box); 
    console.log('debug mobile: end init');
}


Thumbnailer.prototype.setImage = function(path, target)
{
    this.loadImage
    (
        path,
        path.split('/').reverse()[0],
        target
    );
}

Thumbnailer.prototype.setVideo = function(path, timeCapture, target)
{
    console.log('debug mobile: start set video');
    console.log('set Video');
    this.loadVideo
    (
        path,
        path.split('/').reverse()[0],
        timeCapture,
        target
    );
    console.log('debug mobile: end set video');
}


Thumbnailer.prototype.loadImage =  function(file, name, target)
{
    var that =  this;
    var img = new Image();
    img.src = file+'?t='+new Date().getTime();

    img.onload = function() 
    {
        that.imagetocanvas
        ( 
            this, 
            that.width, 
            that.height, 
            that.crop, 
            that.bkg, 
            name,
            target,
            'image'
        );

        img.src = '';
    };
}

Thumbnailer.prototype.loadVideo =  function(file, name, timeCapture, target)
{
    console.log('debug mobile: start load video');

    var metadata = false;
    var play = false;
    var datavideo = false;
    var canplaythrough = false;

    var that =  this;
    var vid = document.createElement('video');
    document.querySelector('#thumbnailerbox').appendChild(vid);
    vid.preload = "auto";
    vid.src = file+'?t='+new Date().getTime();



    vid.addEventListener
    (
        'loadedmetadata', 
        function() 
        {
            console.log('debug mobile: start loadedmetadata');
            vid.currentTime = timeCapture;
            metadata = true;

            if(data && metadata && canplaythrough)
                that.launchVideoCapture(name, target, datavideo);

            console.log('debug mobile: end loadedmetadata');
        }
    );

    vid.addEventListener
    (
        'loadeddata', 
        function() 
        {
            console.log('debug mobile: start loadeddata');
            data = true;

            if(data && metadata && canplaythrough)
                that.launchVideoCapture(name, target, datavideo);

            console.log('debug mobile: end loadeddata');
        }
    );

    vid.addEventListener
    (
        'canplaythrough', 
        function() 
        {
            console.log('debug mobile: start canplaythrough');
            datavideo = this;
            canplaythrough = true;

            if(data && metadata && canplaythrough)
                that.launchVideoCapture(name, target, datavideo);

            console.log('debug mobile: end canplaythrough');
        }
    );

    console.log('debug mobile: end load video');
}

Thumbnailer.prototype.launchVideoCapture = function(name, target, datavideo)
{
    console.log('debug mobile: start launchVideoCapture');
    var that = this;
    setTimeout
    (
        function()
        {
            that.imagetocanvas
            ( 
                datavideo, 
                that.width, 
                that.height, 
                that.crop, 
                that.bkg, 
                name,
                target,
                'video'
            );
        },
        250
    );
    console.log('debug mobile: end launchVideoCapture');
}


Thumbnailer.prototype.imagetocanvas = function
( 
    img, 
    thumbwidth, 
    thumbheight, 
    crop, 
    background, 
    name,
    target,
    type
) 
{
    console.log('imagetocanvas start');
    console.log(img);
    this.canvas.width = thumbwidth;
    this.canvas.height = thumbheight;

    if(type == 'image')
        var dimensions = this.resize(img.width, img.height, thumbwidth, thumbheight);
    if(type == 'video')
        var dimensions = this.resize(img.videoWidth, img.videoHeight, thumbwidth, thumbheight);

    if (crop) 
    {
      this.canvas.width = dimensions.w;
      this.canvas.height = dimensions.h;
      dimensions.x = 0;
      dimensions.y = 0;
    }
      
    this.context.fillStyle = background;
    this.context.fillRect ( 0, 0, thumbwidth, thumbheight );

    this.context.drawImage
    (
      img, dimensions.x, dimensions.y, dimensions.w, dimensions.h
    );

    return this.get(name, target);
}


Thumbnailer.prototype.get = function(name, target) 
{
    var url = this.canvas.toDataURL('image/jpeg', this.quality);
    var thumb = document.querySelector(target);
    thumb.src= url;

    this.execSave();
}

Thumbnailer.prototype.save = function(uri, callback, data) 
{
    var params = (data.length > 0) ? data : {};

    this.saveInfos = 
    {
        'state' : true,
        'uri' : uri,
        'callback': callback,
        'data': data,
    }
}

Thumbnailer.prototype.execSave = function()
{
    if(!this.saveInfos.state)
        return;

    var that = this;
    var xhr = new XMLHttpRequest();

    xhr.open
    (
        'post', 
        this.saveInfos.uri, 
        true
    );

    xhr.upload.onprogress = function(e) 
    {
        
    };

    xhr.onload = function() 
    {
        if (this.status == 200) 
            that.saveInfos.callback('success');
        else
            that.saveInfos.callback('error');
    };

    var formData = new FormData();

    formData.append('file', this.canvas.toDataURL('image/jpeg', this.quality));
    for(var i in this.saveInfos.data)
        formData.append(i, this.saveInfos.data[i]);

    xhr.send(formData);
}



Thumbnailer.prototype.resize = function(imagewidth, imageheight, thumbwidth, thumbheight) 
{
    var w = 0, h = 0, x = 0, y = 0,
        widthratio  = imagewidth / thumbwidth,
        heightratio = imageheight / thumbheight,
        maxratio    = Math.max(widthratio, heightratio);

    if (maxratio > 1) 
    {
        w = imagewidth / maxratio;
        h = imageheight / maxratio;
    } 
    else 
    {
        w = imagewidth;
        h = imageheight;
    }

    x = ( thumbwidth - w ) / 2;
    y = ( thumbheight - h ) / 2;

    return { w:w, h:h, x:x, y:y };
}