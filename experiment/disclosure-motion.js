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
    const startHeight = details.getBoundingClientRect().height;
    if (prior) prior.animation.cancel();

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
    running.set(details,{animation,opening,savedHeight,savedOverflow});
    animation.addEventListener('finish', () => {
      if (running.get(details)?.animation !== animation) return;
      if (!opening) details.open = false;
      animation.cancel();
      details.style.height = savedHeight;
      details.style.overflow = savedOverflow;
      delete details.dataset.disclosureMotion;
      running.delete(details);
    },{once:true});
  });
})();
