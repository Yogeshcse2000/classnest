// Checkpoints that run before a page or API route, to check who is logged in.

// Where each role lands after logging in
const dashboards = {
  admin: '/admin/dashboard',
  student: '/student/dashboard',
};

// For API routes: answer with an error instead of data
function requireRoleApi(role) {
  return (req, res, next) => {
    const user = req.session.user;
    if (!user) {
      return res.status(401).json({ error: 'Please log in first.' });
    }
    if (user.role !== role) {
      return res.status(403).json({ error: 'You are not allowed to do this.' });
    }
    next();
  };
}

// For pages: send the visitor to the right place instead
function requireRolePage(role) {
  return (req, res, next) => {
    const user = req.session.user;
    if (!user) {
      return res.redirect('/');
    }
    if (user.role !== role) {
      return res.redirect(dashboards[user.role]);
    }
    // Don't let the browser keep a copy, so the Back button can't show it after logout
    res.set('Cache-Control', 'no-store');
    next();
  };
}

module.exports = { dashboards, requireRoleApi, requireRolePage };
