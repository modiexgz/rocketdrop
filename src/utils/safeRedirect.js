/** Persist flash + redirect without losing the session on fast redirects. */
function safeRedirect(req, res, url) {
  const done = () => res.redirect(url);
  if (!req.session) return done();
  req.session.save((err) => {
    if (err) console.error("[session] save error:", err.message);
    done();
  });
}

module.exports = { safeRedirect };
