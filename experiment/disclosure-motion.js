/* Dark Signal — unified, cross-browser details motion.
   Delegation survives in-page navigation and preserves native no-JS behavior. */
(() => {
  'use strict';
  if (typeof Element === 'undefined' || !Element.prototype.animate) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const running = new WeakMap();
  const easing = 'cubic-bezier(.22, .61, .36, 1)';
  document.documentElement.classList.add('ds-smooth-disclosures');

  document.addEventListener('click', event => {
    if (event.defaultPrevented || reduceMotion.matches) return;
    const summary = event.target?.closest?.('summary');
    const details = summary?.parentElement;
    if (!details || details.tagName !== 'DETAILS' || summary !== details.querySelector(':scope > summary')) return;

    event.preventDefault();
    const prior = running.get(details);
    const opening = !(prior ? prior.opening : details.open);
    // The milestone's description has a separate, gentle editorial fade.
    // Other disclosures retain their existing height-only animation.
    const story = details.classList.contains('milestone-story')
      ? details.querySelector('.milestone-story-content') : null;
    // Preserve the visible position when a quick second tap reverses motion.
    const currentVisual = story && prior?.contentAnimation ? getComputedStyle(story) : null;
    const fromOpacity = currentVisual ? currentVisual.opacity : (details.open ? '1' : '0');
    const fromTransform = currentVisual ? currentVisual.transform : (opening ? 'translateY(8px)' : 'translateY(0px)');
    const startHeight = details.getBoundingClientRect().height;
    if (prior) {
      prior.animation.cancel();
      prior.contentAnimation?.cancel();
    }

    const savedHeight = prior ? prior.savedHeight : details.style.height;
    const savedOverflow = prior ? prior.savedOverflow : details.style.overflow;
    details.style.height = savedHeight;
    details.style.overflow = savedOverflow;

    // Measure both native states before animating, so tables, multi-column
    // notebook indexes and wrapped mobile text retain intrinsic heights.
    details.open = false;
    const closedHeight = details.getBoundingClientRect().height;
    details.open = true;
    const openHeight = details.getBoundingClientRect().height;
    details.style.height = `${startHeight}px`;
    details.style.overflow = 'hidden';
    details.dataset.disclosureMotion = opening ? 'opening' : 'closing';

    const endHeight = opening ? openHeight : closedHeight;
    const duration = details.classList.contains('notebook-index') ? 900 : 740;
    if (Math.abs(endHeight - startHeight) < 1) {
      if (!opening) details.open = false;
      details.style.height = savedHeight;
      details.style.overflow = savedOverflow;
      delete details.dataset.disclosureMotion;
      running.delete(details);
      return;
    }
    const animation = details.animate(
      [{height:`${startHeight}px`},{height:`${endHeight}px`}],
      {duration, easing, fill:'both'}
    );
    // Slightly delay the reveal, so the panel opens before its text arrives.
    // During closing, fade first and let the existing height animation finish.
    // Opacity/transform do not alter text wrapping or panel measurements.
    const contentAnimation = story ? story.animate(
      [
        {opacity:fromOpacity, transform:fromTransform},
        {opacity:opening ? 1 : 0, transform:opening ? 'translateY(0px)' : 'translateY(-4px)'}
      ],
      {duration:opening ? 520 : 300, delay:opening ? 115 : 0, easing, fill:'both'}
    ) : null;
    running.set(details,{animation,contentAnimation,opening,savedHeight,savedOverflow});
    animation.addEventListener('finish', () => {
      if (running.get(details)?.animation !== animation) return;
      if (!opening) details.open = false;
      contentAnimation?.cancel();
      animation.cancel();
      details.style.height = savedHeight;
      details.style.overflow = savedOverflow;
      delete details.dataset.disclosureMotion;
      running.delete(details);
    },{once:true});
  });
})();
