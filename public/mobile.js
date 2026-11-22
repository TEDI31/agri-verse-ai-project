(function () {
  var btn = document.getElementById('mbtn');
  var scrim = document.getElementById('mscrim');
  if (!btn || !scrim) return;

  function setOpen(open) {
    document.body.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  btn.addEventListener('click', function () {
    setOpen(!document.body.classList.contains('menu-open'));
  });
  scrim.addEventListener('click', function () { setOpen(false); });

  // choosing a feature (or Log out) closes the drawer
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('aside button')) setOpen(false);
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 820) setOpen(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') setOpen(false);
  });
})();