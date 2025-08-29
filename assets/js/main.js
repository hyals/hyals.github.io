/* #####################################
########################################
OPENCLOSE FUNCTION (SPOILERS, TOGGLES)
########################################
########################################
*/

function openclose(obj){
var id = obj;
var e = document.getElementById(id);
if(e.style.display == 'block'){
e.style.display = 'none';
}else{
e.style.display = 'block';
}
}

/* #####################################
########################################
SWIPE RIGHT TO OPEN HAMBURGER MENU
########################################
########################################
*/


window.addEventListener("load", () => {
  const touchsurface = document.getElementById("content");

  let startX = 0;
  let startY = 0;
  let startTime = 0;

  const threshold = 80;     // Minimum horizontal distance for swipe
  const restraint = 100;    // Maximum vertical deviation allowed
  const allowedTime = 200;  // Max time (ms) for swipe gesture

  const handleSwipe = (direction) => {
    if (direction === "right") {
      window.location.hash = "#sidebar";
    }
  };

  touchsurface.addEventListener("touchstart", (e) => {
    const touch = e.changedTouches[0];
    startX = touch.pageX;
    startY = touch.pageY;
    startTime = Date.now(); // record time when finger first makes contact
  });

  touchsurface.addEventListener("touchend", (e) => {
    const touch = e.changedTouches[0];
    const distX = touch.pageX - startX;
    const distY = touch.pageY - startY;
    const elapsedTime = Date.now() - startTime;

    let swipeDirection = null;

    if (elapsedTime <= allowedTime) {
      if (Math.abs(distX) >= threshold && Math.abs(distY) <= restraint) {
        swipeDirection = distX > 0 ? "right" : "left";
      }
    }

    if (swipeDirection) {
      handleSwipe(swipeDirection);
    }
  });
});



/* #####################################
########################################
OTHER
########################################
########################################
*/

function OpenCloseModal(div_id) {
                   var popup = document.getElementById(div_id);
                    if (document.querySelector('.modal.active') != null) {
                      popup.classList.remove('active');  
                    }else{
                    popup.classList.add('active');
                   }
                   }
