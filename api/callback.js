export default function handler(req, res) {
  const { code } = req.query;
  
  if (!code) {
    return res.redirect("/?error=no_code");
  }

  // Discord sends the code here — redirect user to your success page
  res.redirect("/?verified=true");
}
