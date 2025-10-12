import SocialMediaLinks from './SocialMediaLinks';

const Footer = () => (
  <footer className="w-full py-6 text-center text-muted-foreground border-t border-border mt-12 bg-gaming-dark/30 backdrop-blur-sm">
    <div className="container mx-auto px-4">
      <SocialMediaLinks variant="footer" />
      <div className="mt-6 space-y-2">
        <p>© 2025 Adventure RP. All rights reserved.</p>
        <p className="text-sm">Contact: admin@adventurerp.dk</p>
      </div>
    </div>
  </footer>
);

export default Footer;
