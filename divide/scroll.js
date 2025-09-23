    (() => {
      const wrap = document.getElementById('thumbWrap'),
            thumb = document.getElementById('thumb'),
            track = document.getElementById('scrollTrack'),
            ring = document.getElementById('ring'),
            container = document.getElementById('scrollContainer');

      const R = 14, circumference = 2 * Math.PI * R;
      ring.style.strokeDasharray = circumference;

      let isDragging = false, hideTimeout, targetRatio = 0, animating = false;

      const available = () => window.innerHeight - 48 - 24;

      const showThumb = () => {
        track.classList.remove('hidden');
        clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => track.classList.add('hidden'), 3000);
      };

      const pointerToRatio = y => Math.min(1, Math.max(0, (y - 12) / available()));

      const setTargetRatio = ratio => {
        targetRatio = Math.min(1, Math.max(0, ratio));
        if (!animating) requestAnimationFrame(animateThumb);
      };

      const animateThumb = () => {
        animating = true;
        const scrollHeight = container.scrollHeight - container.clientHeight;
        const currentRatio = scrollHeight ? container.scrollTop / scrollHeight : 0;
        const delta = targetRatio - currentRatio;
        if (Math.abs(delta) < 0.001) {
          container.scrollTop = scrollHeight * targetRatio;
          animating = false;
          return;
        }
        container.scrollTop = scrollHeight * (currentRatio + delta * 0.3);
        updateThumb();
        requestAnimationFrame(animateThumb);
      };

      const updateThumb = () => {
        const scrollTop = container.scrollTop;
        const scrollHeight = container.scrollHeight - container.clientHeight;
        const ratio = scrollHeight ? scrollTop / scrollHeight : 0;
        wrap.style.transform = `translateY(${12 + available() * ratio}px)`;
        ring.style.strokeDashoffset = circumference * (1 - ratio);
      };

      const dragMove = y => setTargetRatio(pointerToRatio(y));

      const dragStart = e => {
        isDragging = true;
        thumb.setPointerCapture?.(e.pointerId);
        thumb.style.transition = 'none';
      };

      const dragEnd = e => {
        isDragging = false;
        thumb.releasePointerCapture?.(e?.pointerId);
        thumb.style.transition = 'transform 0.15s cubic-bezier(.2, .9, .3, 1)';
      };

      container.addEventListener('scroll', () => { if(!isDragging) updateThumb(); showThumb(); });
      window.addEventListener('resize', () => { updateThumb(); showThumb(); });

      thumb.addEventListener('pointerdown', dragStart);
      document.addEventListener('pointermove', e => isDragging && dragMove(e.clientY));
      document.addEventListener('pointerup', dragEnd);

      thumb.addEventListener('touchstart', e => { if(e.touches.length===1){ isDragging=true; thumb.style.transition='none'; } }, {passive:true});
      document.addEventListener('touchmove', e => { if(isDragging && e.touches.length===1) dragMove(e.touches[0].clientY); }, {passive:false});
      document.addEventListener('touchend', dragEnd);

      track.addEventListener('pointerdown', e => { if(e.target!==thumb){ dragMove(e.clientY); isDragging=true; thumb.setPointerCapture?.(e.pointerId); } });

      document.addEventListener('wheel', e => {
        if(!container.contains(e.target)){
          container.scrollTop += e.deltaY;
          setTargetRatio(container.scrollTop / (container.scrollHeight - container.clientHeight));
          showThumb();
          e.preventDefault();
        }
      }, {passive:false});

      ['pointermove','pointerdown','keydown','touchmove','touchstart'].forEach(evt => document.addEventListener(evt, showThumb));

      setTargetRatio(0);
      showThumb();
    })();
