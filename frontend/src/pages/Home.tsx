import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAuthenticated } from '../lib/auth';
import { motion } from 'framer-motion';
import './Home.css';

function FadeInUpSection({ children, className, id, style }: { children: React.ReactNode; className?: string; id?: string; style?: React.CSSProperties }) {
  return (
    <motion.section
      id={id}
      className={className}
      style={style}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7, ease: "easeOut" }}
    >
      {children}
    </motion.section>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const isLoggedIn = isAuthenticated();
  
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [contactSuccess, setContactSuccess] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email || !contactForm.message) return;
    setContactSuccess(true);
    setTimeout(() => {
      setContactSuccess(false);
      setShowContactModal(false);
      setContactForm({ name: '', email: '', message: '' });
    }, 2000);
  };

  return (
    <div className="home-container">
      {/* Premium Navigation Header */}
      <header className="home-header">
        <div className="logo-section">
          <span className="logo-icon">⚖️</span>
          <div className="logo-text">
            <span className="logo-title">LegalCase</span>
            <span className="logo-subtitle">Elite Counsel System</span>
          </div>
        </div>
        <nav className="header-nav">
          <a href="#features">Features</a>
          <a href="#practice-areas">Practice Areas</a>
          <a href="#why-choose-us">Why Choose Us</a>
          <a href="#testimonials">Testimonials</a>
        </nav>
        <div className="header-actions">
          <motion.button 
            type="button" 
            className="btn btn-primary"
            onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isLoggedIn ? 'Go to Dashboard' : 'Lawyer Login'}
          </motion.button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero-section" style={{ backgroundImage: `linear-gradient(rgba(28, 28, 28, 0.85), rgba(28, 28, 28, 0.85)), url("/images/courtroom_hero.png")` }}>
        <motion.div 
          className="hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="hero-gold-tag">Est. 2001 &bull; Prestige & Integrity</span>
          <h1 className="hero-title">Justice. Integrity. Results.</h1>
          <p className="hero-subtitle">
            Providing sophisticated case management, calendar tracking, and invoicing solutions tailored for distinguished law firms and legal counsels.
          </p>
          <div className="hero-actions">
            <motion.button 
              type="button" 
              className="btn btn-primary btn-lg"
              onClick={() => navigate(isLoggedIn ? '/dashboard' : '/login')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Access System
            </motion.button>
            <motion.button 
              type="button" 
              className="btn btn-secondary btn-lg"
              onClick={() => setShowContactModal(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Contact Counsel
            </motion.button>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <FadeInUpSection id="features" className="section-padding features-section">
        <div className="section-header-centered">
          <span className="section-tag">System Capabilities</span>
          <h2 className="section-title">Designed for Corporate & Trial Litigation</h2>
          <p className="section-subtitle">Fully automated, multi-tenant scoped environment engineered to secure your client data.</p>
        </div>
        
        <div className="grid-cards-container">
          <motion.div className="card feature-card" whileHover={{ y: -6, borderColor: '#C8A96A' }} transition={{ duration: 0.25 }}>
            <div className="feature-icon-wrapper">⚖️</div>
            <h3>Case Lifecycle</h3>
            <p>Monitor litigation records, timeline events, and lawyer assignments privately in real-time.</p>
          </motion.div>
          <motion.div className="card feature-card" whileHover={{ y: -6, borderColor: '#C8A96A' }} transition={{ duration: 0.25 }}>
            <div className="feature-icon-wrapper">🏛️</div>
            <h3>Hearings Calendar</h3>
            <p>Synchronize future court hearings, venues, and status logs with client search parameters.</p>
          </motion.div>
          <motion.div className="card feature-card" whileHover={{ y: -6, borderColor: '#C8A96A' }} transition={{ duration: 0.25 }}>
            <div className="feature-icon-wrapper">📜</div>
            <h3>Client Invoicing</h3>
            <p>Record, credit, and adjust payment summaries with local currency support (₹) instantly.</p>
          </motion.div>
          <motion.div className="card feature-card" whileHover={{ y: -6, borderColor: '#C8A96A' }} transition={{ duration: 0.25 }}>
            <div className="feature-icon-wrapper">👨‍⚖️</div>
            <h3>Assistant Scoping</h3>
            <p>Link and manage multiple assistant lawyers, keeping cases and files isolated dynamically.</p>
          </motion.div>
        </div>
      </FadeInUpSection>

      {/* Practice Areas Section */}
      <FadeInUpSection id="practice-areas" className="section-padding practice-areas-section">
        <div className="section-header-centered">
          <span className="section-tag">Practice Focus</span>
          <h2 className="section-title">Areas of Legal Excellence</h2>
          <p className="section-subtitle">Covering complex local, national, and corporate jurisdictions.</p>
        </div>

        <div className="grid-cards-container">
          <motion.div className="card practice-card" whileHover={{ y: -6, borderColor: '#C8A96A' }} transition={{ duration: 0.25 }}>
            <div className="practice-header">
              <span className="practice-num">01</span>
              <h3>Criminal Law</h3>
            </div>
            <p>Defense representation, prosecution oversight, corporate fraud, and trial proceedings.</p>
          </motion.div>
          <motion.div className="card practice-card" whileHover={{ y: -6, borderColor: '#C8A96A' }} transition={{ duration: 0.25 }}>
            <div className="practice-header">
              <span className="practice-num">02</span>
              <h3>Civil Law</h3>
            </div>
            <p>Breach of contract, property disputes, civil liability, tort litigation, and recovery.</p>
          </motion.div>
          <motion.div className="card practice-card" whileHover={{ y: -6, borderColor: '#C8A96A' }} transition={{ duration: 0.25 }}>
            <div className="practice-header">
              <span className="practice-num">03</span>
              <h3>Corporate Law</h3>
            </div>
            <p>Mergers and acquisitions, regulatory compliance, equity structures, and advisory contracts.</p>
          </motion.div>
          <motion.div className="card practice-card" whileHover={{ y: -6, borderColor: '#C8A96A' }} transition={{ duration: 0.25 }}>
            <div className="practice-header">
              <span className="practice-num">04</span>
              <h3>Family Law</h3>
            </div>
            <p>Estate planning, divorce mediation, trust settlements, custody, and probate administration.</p>
          </motion.div>
        </div>
      </FadeInUpSection>

      {/* Why Choose Us Section */}
      <FadeInUpSection id="why-choose-us" className="section-padding why-choose-us-section">
        <div className="why-content-wrapper">
          <div className="why-left">
            <span className="section-tag">Why Choose Us</span>
            <h2 className="section-title">An Authority in Legal Advisory and Litigation</h2>
            <p>We blend legacy legal values with refined modern workflows, ensuring absolute compliance and security.</p>
            <div className="stats-box-grid">
              <motion.div className="stat-box" whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                <span className="stat-num">25+</span>
                <span className="stat-label">Years of Experience</span>
              </motion.div>
              <motion.div className="stat-box" whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                <span className="stat-num">98%</span>
                <span className="stat-label">Case Success Rate</span>
              </motion.div>
              <motion.div className="stat-box" whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                <span className="stat-num">10k+</span>
                <span className="stat-label">Satisfied Clients</span>
              </motion.div>
              <motion.div className="stat-box" whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                <span className="stat-num">24/7</span>
                <span className="stat-label">Premium Support</span>
              </motion.div>
            </div>
          </div>
        </div>
      </FadeInUpSection>

      {/* Testimonials Section */}
      <FadeInUpSection id="testimonials" className="section-padding testimonials-section">
        <div className="section-header-centered">
          <span className="section-tag">Client Reviews</span>
          <h2 className="section-title">Endorsements from Trusted Entities</h2>
          <p className="section-subtitle">Read feedback from corporate clients and private individuals we served.</p>
        </div>

        <div className="grid-cards-container">
          <motion.div className="card testimonial-card" whileHover={{ y: -6, borderColor: '#C8A96A' }} transition={{ duration: 0.25 }}>
            <div className="rating">⭐⭐⭐⭐⭐</div>
            <p className="testi-text">
              "The level of transparency, professionalism, and commitment to justice demonstrated here is truly unparalleled. Highly recommended."
            </p>
            <div className="testi-author">
              <strong>Devendra K. Sharma</strong>
              <span>CEO, Sharma Ventures</span>
            </div>
          </motion.div>
          <motion.div className="card testimonial-card" whileHover={{ y: -6, borderColor: '#C8A96A' }} transition={{ duration: 0.25 }}>
            <div className="rating">⭐⭐⭐⭐⭐</div>
            <p className="testi-text">
              "Absolute isolation of data, clear invoices, and precise scheduling. Their system works flawlessly."
            </p>
            <div className="testi-author">
              <strong>Priya R. Sen</strong>
              <span>General Counsel, TechCorp</span>
            </div>
          </motion.div>
        </div>
      </FadeInUpSection>

      {/* Call to Action Section */}
      <FadeInUpSection className="cta-section">
        <div className="cta-content">
          <h2 className="cta-title">Require Elite Legal Counsel?</h2>
          <p className="cta-desc">Speak with our senior advocates to discuss case representation and advisory schedules.</p>
          <motion.button 
            type="button" 
            className="btn btn-primary btn-lg"
            onClick={() => setShowContactModal(true)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Submit Inquiry
          </motion.button>
        </div>
      </FadeInUpSection>

      {/* Premium Footer */}
      <footer className="home-footer">
        <div className="footer-top">
          <div className="footer-col">
            <span className="logo-icon">⚖️</span>
            <h3>LegalCase</h3>
            <p className="footer-about">Sophisticated case management and client record portal for distinguished legal advisors.</p>
          </div>
          <div className="footer-col">
            <h4>Quick Links</h4>
            <a href="#features">Features</a>
            <a href="#practice-areas">Practice Areas</a>
            <a href="#why-choose-us">Why Choose Us</a>
          </div>
          <div className="footer-col">
            <h4>Contact Info</h4>
            <p>📍 Supreme Chambers, Delhi, India</p>
            <p>📞 +91 98765 43210</p>
            <p>✉️ info@legalcase.example</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} LegalCase. Premium Law Case Management System. All rights reserved.</p>
        </div>
      </footer>

      {/* Contact Inquiry Modal */}
      {showContactModal && (
        <div className="modal-overlay" onClick={() => setShowContactModal(false)}>
          <motion.div 
            className="modal" 
            onClick={e => e.stopPropagation()}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
          >
            <h2 className="modal-title">Consultation Inquiry</h2>
            {contactSuccess ? (
              <div className="alert alert-success">Your message has been sent to our counselors.</div>
            ) : (
              <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    className="form-input"
                    value={contactForm.name}
                    onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={contactForm.email}
                    onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                    placeholder="you@example.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Inquiry Details</label>
                  <textarea
                    className="form-input"
                    rows={4}
                    value={contactForm.message}
                    onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Brief description of your legal inquiry..."
                    required
                  />
                </div>
                <div className="modal-actions" style={{ marginTop: '20px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowContactModal(false)}>Cancel</button>
                  <motion.button 
                    type="submit" 
                    className="btn btn-primary"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Submit Inquiry
                  </motion.button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
