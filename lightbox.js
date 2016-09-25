//load 32 images
//have a load more button on the bottom
//adds to the gallery of thumbnails displayed on the page

//PHOTO URL
//
// https://farm1.staticflickr.com/2/1418878_1e92283336_m.jpg
//
// farm-id: 1
// server-id: 2
// photo-id: 1418878
// secret: 1e92283336
// size: m

//TODO: Error handling for requests + xml parsing
//TODO: only load 32 photos from server at a time
//TODO: overlay full height
//TODO: image loading spinner
//TODO: abstract flickr stuff into its own function
//TODO: promises?

//TODO: photoset object - OO
//TODO: make sure full size image isn't wider than screen
//TODO: close button and scroll buttons
//TODO: load more photos

(function (){

  function FlickrPhoto(serverId, farmId, id, secret){
    this.serverId = serverId;
    this.farmId = farmId;
    this.photoId = id;
    this.secret = secret;
  }

  FlickrPhoto.prototype = {
    constructor: FlickrPhoto,
    getUrl: function(){
      return `https://farm${this.farmId}.staticflickr.com/${this.serverId}/${this.photoId}_${this.secret}_b.jpg`
    }
  }

  function PhotoSet(url, id, page, photosPerPage, numberOfPages, total, title){
    this.url = url;
    this.photosetId = id;
    this.page = page;
    this.photosPerPage = photosPerPage;
    this.numberOfPages = numberOfPages;
    this.total = total;
    this.photosetTitle = title;

    this.photos = [];
  }

  PhotoSet.prototype = {
    constructor: PhotoSet,
    setCurrentPhoto: function (index){
      this.currentPhoto = index;
    },
    getCurrentPhoto: function(){
      return this.currentPhoto;
    },
    getPhoto: function(index){
      return this.photos[index];
    },
    getNextPhoto: function(){

    },
    addPhoto: function(photo){
      this.photos.push(photo);
    }
  }

  var lightboxPhotos;


  function initLightbox(){
    //create all document elements first - with no display to be called in showLightbox()

    //TODO: make all variable name consistent
    var overlay = document.createElement('div');
    overlay.setAttribute('class', 'darkOverlay');
    overlay.setAttribute('id', 'overlay');
    overlay.onclick = hideLightbox;
    document.body.appendChild(overlay);

    var lightboxImg = document.createElement('img');
    lightboxImg.setAttribute('id', 'lightbox');
    lightboxImg.setAttribute('class', 'lightboxImg');
    document.body.appendChild(lightboxImg);

    getImagesFromServer(api_key, photoset_id, user_id, per_page, page);
  }

  //TODO: refactor
  function getImagesFromServer(api_key, photoset_id, user_id, per_page, page){
    function loadXMLDoc() {
        var xhttp = new XMLHttpRequest();

        xhttp.onreadystatechange = function() {
            if (xhttp.readyState == XMLHttpRequest.DONE ) {
               if (xhttp.status == 200) {
                 createPhotos(xhttp.responseText);
               }
               else if (xhttp.status == 400) {
                  console.log('There was an error 400');
               }
               else {
                   console.log('something else other than 200 was returned');
               }
            }
        };

        xhttp.open("GET", `https://api.flickr.com/services/rest/?method=flickr.photosets.getPhotos&api_key=${api_key}&photoset_id=${photoset_id}&user_id=${user_id}&per_page=${per_page}&page=${page}`, true);
        xhttp.send();
    }
    loadXMLDoc();
  }

  function createPhotos(xmlPhotos){
    var photosObj = parseXML(xmlPhotos);
    var photoset = photosObj.getElementsByTagName("photoset")[0];
    var photos = photosObj.getElementsByTagName("photo");

    lightboxPhotos = new PhotoSet('url', photoset.getAttribute('id'), photoset.getAttribute('page'), photoset.getAttribute('perpage'), photoset.getAttribute('pages'), photoset.getAttribute('total'), photoset.getAttribute('title'));

    for (i = 0; i < photos.length; i++) {
        var photo = new FlickrPhoto(photos[i].getAttribute('server'), photos[i].getAttribute('farm'), photos[i].getAttribute('id'), photos[i].getAttribute('secret'));

        lightboxPhotos.addPhoto(photo);

        createThumbnail(photo, i);
    }
    console.log(lightboxPhotos);
  }

  function parseXML(text){
      var xmlObject;
      if (window.DOMParser){
        var parser = new DOMParser();
        xmlObject = parser.parseFromString(text,"text/xml");
      }
      else { //Internet Explorer
        xmlObject=new ActiveXObject("Microsoft.XMLDOM");
        xmlObject.async=false;
        xmlObject.loadXML(text);
      }
      return xmlObject;
  }

  function createThumbnail(photo, index){
    var imageUrl = photo.getUrl();
    var photosetElement = document.getElementById("photoset");

    var link = document.createElement('a');
    link.setAttribute('href', '#');
    link.onclick = function () {
      showLightbox(this);
      return false;
    };

    var thumbnail = document.createElement('div');
    thumbnail.setAttribute('class', 'square');
    thumbnail.setAttribute('id', index);
    thumbnail.style.backgroundImage = `url(${imageUrl})`;

    link.appendChild(thumbnail);
    photosetElement.appendChild(link);
  }

  function showLightbox(image){
    var photoIndex = image.getElementsByTagName("div")[0].getAttribute('id');
    var photo = lightboxPhotos.getPhoto(photoIndex);

    lightboxPhotos.setCurrentPhoto(photoIndex);

    console.log(photo);

    createLightboxImage(photo);

    var windowWidth = document.body.clientWidth;
    var windowHeight = document.body.clientHeight;

    var overlay = document.getElementById("overlay");
    overlay.style.display = 'block';
    overlay.style.height = windowHeight;

    //disable scrolling when lightbox is open
    document.body.className += 'disableScrolling';

    //listen for key presses
    document.onkeydown = getKey;

  }

  function createLightboxImage(photo){
    //TODO: make IE compatible
    //TODO: function for page size
    //TODO: resize image - max width and height: 100% of screen - 50px (or something like that)

    var windowWidth = document.body.clientWidth;
    var windowHeight = document.body.clientHeight;

    var lightboxImg = document.getElementById('lightbox');
    lightboxImg.style.display = 'block';
    lightboxImg.setAttribute('src', photo.getUrl());
    lightboxImg.style.left = (windowWidth / 2) - (lightboxImg.clientWidth /2);
    lightboxImg.style.top = (windowHeight / 2) - (lightboxImg.clientHeight /2);
  }

  function navigate(e){
    var key;

    var limit = function(key) {
      if (key == "right") return (lightboxPhotos.photosPerPage * lightboxPhotos.page) - 1;
      else if (key == "left") return 0;
    };

    var next = function(key) {
      if (key == "right") return parseInt(photoIndex)+1;
      else if (key == "left") return parseInt(photoIndex) - 1 ;
    };

    if (e.keyCode === 39 || e.keyCode === 37) {
      if (e.keyCode === 39) {
        key = "right";
      } else if (e.keyCode === 37) {
        key = "left";
      }

      var photoIndex = lightboxPhotos.getCurrentPhoto();
      var nextPhoto = photoIndex == limit(key) ? photoIndex : next(key);

      lightboxPhotos.setCurrentPhoto(nextPhoto);
      createLightboxImage(lightboxPhotos.getPhoto(nextPhoto));
    }
  }

  function hideLightbox(){
    var lightboxImg = document.getElementById('lightbox');
    var overlay = document.getElementById("overlay");

    lightboxImg.style.display = 'none';
    overlay.style.display = 'none';

    //remove "disableScrolling" class so page is once again scrollable
    document.body.className = document.body.className.replace( /(?:^|\s)disableScrolling(?!\S)/g , '' );

    //stop listening for key press
    document.onkeydown = null;
  }


  function getKey(e){
    e = e || window.event;
    navigate(e);
  }



var api_key = '6e7f8f609846236e84cc48c061c4d4a4';
var photoset_id = '72157672393641335';
var user_id = '142612890@N04';
var per_page = '12';
var page = '1';

window.onload = function () {
  initLightbox();
}

})();
