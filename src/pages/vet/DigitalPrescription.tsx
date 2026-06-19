import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const DigitalPrescription = () => {
  const navigate = useNavigate();
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  // Dynamically inject stylesheets for Inter and Material Symbols
  useEffect(() => {
    const linkInter = document.createElement("link");
    linkInter.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
    linkInter.rel = "stylesheet";
    document.head.appendChild(linkInter);

    const linkSymbols = document.createElement("link");
    linkSymbols.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0";
    linkSymbols.rel = "stylesheet";
    document.head.appendChild(linkSymbols);

    return () => {
      document.head.removeChild(linkInter);
      document.head.removeChild(linkSymbols);
    };
  }, []);

  const handleOrderMedicine = (medName: string) => {
    toast.success(`Success! Added ${medName} to cart & initiated order.`);
  };

  const handleBookLabTest = (testName: string) => {
    toast.success(`Home collection booked successfully for ${testName}!`);
  };

  const handleViewAttachment = (fileName: string) => {
    toast.info(`Opening ${fileName} in secure viewer...`);
  };

  const handleViewPassport = (e: React.MouseEvent) => {
    e.preventDefault();
    toast.info("Opening Luna's official Pet Passport passport details...");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Prescription link copied to clipboard for easy sharing!");
  };

  const submitFeedback = () => {
    if (rating === 0) {
      toast.error("Please select a rating star to submit your review");
      return;
    }
    toast.success(`Thank you! Your verified consultation review (${rating} Stars) has been submitted successfully.`);
    setIsFeedbackOpen(false);
    setRating(0);
    setReview("");
  };

  return (
    <div className="digital-prescription-root">
      {/* Dynamic Scoped CSS Styles injected directly here */}
      <style>{`
        .digital-prescription-root {
          --bg-color: #F8F9FC; 
          --white: #FFFFFF;
          --primary: #DE468B; 
          --primary-light: #FCE7F3; 
          --primary-border: #FBCFE8; 
          --text-dark: #1E1E2D;
          --text-gray: #6B7280;
          --text-light-gray: #9CA3AF;
          --border-color: #EFEFF5;
          --success-green: #10B981;
          --success-bg: #E6F7ED;
          --warning-yellow: #F59E0B;
          --danger-red: #EF4444;
          --font-family: 'Inter', sans-serif;
          --card-shadow: 0 4px 20px rgba(0,0,0,0.02);
          --border-radius: 24px;
          
          background-color: var(--bg-color);
          font-family: var(--font-family);
          min-height: 100vh;
          color: var(--text-dark);
          position: relative;
        }

        .digital-prescription-root * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          -webkit-tap-highlight-color: transparent;
        }

        .app-container {
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
          background-color: var(--bg-color);
          min-height: 100vh;
          position: relative;
          padding-bottom: 50px; 
        }

        /* --- Header --- */
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          background-color: var(--bg-color);
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .icon-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--white);
          border-radius: 50%;
          color: var(--text-dark);
          box-shadow: 0 2px 10px rgba(0,0,0,0.02);
          cursor: pointer;
          border: 1px solid var(--border-color);
          outline: none;
          transition: background-color 0.2s;
        }

        .icon-btn:hover {
          background-color: #F3F4F6;
        }

        .header-title {
          font-size: 16px;
          font-weight: 600;
        }

        /* --- Doctor Card --- */
        .doctor-card {
          background: var(--white);
          margin: 10px 20px 20px;
          border-radius: var(--border-radius);
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: var(--card-shadow);
          border: 1px solid var(--border-color);
          text-align: left;
        }

        .doctor-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--primary-light);
        }

        .doctor-info h2 {
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .doctor-info p {
          color: var(--text-gray);
          font-size: 12px;
          font-weight: 500;
          margin-bottom: 2px;
        }

        .doctor-info .reg-id {
          color: var(--text-light-gray);
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        /* --- Patient Card --- */
        .patient-card {
          background: var(--white);
          margin: 0 16px 20px 16px;
          border-radius: 24px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.02);
          text-align: left;
        }

        .avatar-container {
          position: relative;
          flex-shrink: 0;
        }

        .avatar {
          width: 74px;
          height: 74px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--primary);
          padding: 2px;
        }

        .status-dot {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 14px;
          height: 14px;
          background-color: var(--success-green);
          border: 2.5px solid var(--white);
          border-radius: 50%;
        }

        .patient-info {
          flex: 1;
          min-width: 0; 
        }

        .patient-info h2 {
          color: var(--text-dark);
          font-size: 17px;
          font-weight: 700;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pet-breed {
          color: var(--primary);
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .patient-info p {
          color: var(--text-gray);
          font-size: 12px;
          margin-bottom: 2px;
          font-weight: 500;
        }
        
        .tags {
          display: flex;
          gap: 6px;
          margin-top: 8px;
          flex-wrap: nowrap; 
          overflow-x: auto;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .tags::-webkit-scrollbar {
          display: none;
        }

        .tag {
          padding: 6px 10px;
          border-radius: 12px;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.5px;
          white-space: nowrap;
        }

        .tag-primary {
          background-color: var(--primary-light);
          color: var(--primary);
        }

        .tag-secondary {
          background-color: #F0F0F5;
          color: var(--text-gray);
        }

        /* --- Prescription Meta Strip --- */
        .prescription-meta-strip {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 0 20px 24px 20px;
        }

        .issue-date {
          font-size: 12px;
          color: var(--text-gray);
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .passport-btn {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-gray);
          padding: 6px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: all 0.2s;
        }
        
        .passport-btn:hover {
          background: #F0F0F5;
          color: var(--text-dark);
          border-color: #E5E7EB;
        }

        /* --- Section Containers --- */
        .section-container {
          margin: 0 20px 24px 20px;
          text-align: left;
        }

        .section-header-title {
          display: flex;
          align-items: center;
          font-size: 11px;
          font-weight: 700;
          color: var(--text-light-gray);
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
          gap: 8px;
        }

        .section-header-title .material-symbols-outlined {
          font-size: 18px;
          color: var(--primary);
        }

        /* --- Vitals UI Grid --- */
        .vitals-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .vital-metric-card {
          background: var(--white);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          box-shadow: var(--card-shadow);
        }

        .metric-label {
          font-size: 10px;
          color: var(--text-gray);
          font-weight: 600;
          text-transform: uppercase;
        }

        .metric-value {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-dark);
        }

        /* --- Diagnosis Chips Layout --- */
        .chips-inline-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .user-prescription-chip {
          background-color: var(--primary-light);
          color: var(--primary);
          padding: 10px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
        }

        /* --- Prescribed Medicines Area --- */
        .med-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .med-card {
          background: var(--white);
          border-radius: var(--border-radius);
          padding: 16px;
          box-shadow: var(--card-shadow);
          border: 1px solid var(--border-color);
        }

        .med-details {
          display: flex;
          gap: 16px;
          margin-bottom: 14px;
        }

        .med-img {
          width: 60px;
          height: 60px;
          border-radius: 14px;
          object-fit: cover;
          background-color: #F0F0F5;
        }

        .med-info {
          flex: 1;
        }

        .med-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 4px;
        }

        .med-name {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-dark);
        }

        .med-price {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-dark);
        }

        .med-desc {
          font-size: 12px;
          color: var(--text-gray);
          margin-bottom: 6px;
        }

        .stock-status {
          font-size: 11px;
          font-weight: 700;
          color: var(--success-green);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .stock-status span {
          color: var(--text-light-gray);
          font-weight: 500;
        }

        .btn-action {
          width: 100%;
          background: var(--primary);
          color: var(--white);
          border: none;
          padding: 12px;
          border-radius: 14px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: opacity 0.2s;
          font-family: var(--font-family);
          outline: none;
        }

        .btn-action:hover {
          opacity: 0.9;
        }

        /* --- Recommended Lab Tests --- */
        .lab-card {
          background: var(--white);
          border-radius: 20px;
          padding: 16px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: var(--card-shadow);
          border: 1px solid var(--border-color);
          gap: 12px;
        }

        .lab-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        }

        .lab-icon {
          width: 42px;
          height: 42px;
          background: var(--primary-light);
          color: var(--primary);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .lab-info {
          flex: 1;
          min-width: 0;
        }

        .lab-info h4 {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 2px;
          color: var(--text-dark);
          white-space: normal;
          word-break: break-word;
        }

        .lab-info p {
          font-size: 11px;
          color: var(--text-gray);
        }

        .btn-book {
          background: var(--primary);
          color: var(--white);
          border: none;
          padding: 0 16px;
          height: 40px; 
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          font-family: var(--font-family);
          flex-shrink: 0; 
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s;
          outline: none;
        }

        .btn-book:hover {
          opacity: 0.9;
        }

        /* --- Administration Notes --- */
        .notes-card {
          background: var(--primary-light);
          border-radius: var(--border-radius);
          padding: 20px;
          border: 1px solid var(--primary-border);
        }

        .notes-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 700;
          color: var(--primary);
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .note-item {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
          align-items: flex-start;
        }

        .note-item:last-child {
          margin-bottom: 0;
        }

        .note-num {
          width: 22px;
          height: 22px;
          background: var(--primary);
          color: var(--white);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          flex-shrink: 0;
          margin-top: 2px;
        }

        .note-text {
          font-size: 13px;
          color: var(--text-dark);
          line-height: 1.5;
        }

        /* --- Clinical Findings Box --- */
        .findings-summary-box {
          background: var(--white);
          border: 1px solid var(--border-color);
          border-radius: 20px;
          padding: 16px;
          font-size: 13px;
          color: var(--text-dark);
          line-height: 1.6;
          box-shadow: var(--card-shadow);
        }

        /* --- Reports & Attachments --- */
        .user-attachments-row {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .attachment-view-card {
          background: var(--white);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: var(--card-shadow);
          cursor: pointer;
        }

        .attachment-meta {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .attachment-meta .file-icon {
          font-size: 24px;
        }

        .file-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-dark);
        }

        .file-size {
          font-size: 11px;
          color: var(--text-gray);
        }

        .view-action-btn {
          color: var(--primary);
          font-size: 12px;
          font-weight: 700;
        }

        /* --- Consultation Outcome Badge --- */
        .outcome-card-display {
          background: var(--success-bg);
          padding: 10px 16px;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          color: var(--success-green);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .outcome-indicator-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--success-green);
        }

        /* --- Next Appointment Card --- */
        .appointment-card {
          background: linear-gradient(135deg, #DE468B, #A21CAF);
          border-radius: var(--border-radius);
          padding: 24px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: var(--white);
          box-shadow: 0 10px 20px rgba(222, 70, 139, 0.2);
        }

        .appt-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 6px;
          opacity: 0.8;
        }

        .appt-date {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .appt-desc {
          font-size: 13px;
          opacity: 0.9;
        }

        .appt-icon {
          width: 48px;
          height: 48px;
          background: rgba(255,255,255,0.2);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          backdrop-filter: blur(4px);
        }
        
        .shop-link {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--primary);
          font-size: 12px;
          font-weight: 700;
          text-decoration: none;
        }

        /* --- Premium Feedback Button --- */
        .feedback-trigger-zone {
          margin: 28px 20px 10px 20px;
        }

        .btn-trigger-feedback {
          width: 100%;
          background: #1E1E2D;
          color: var(--white);
          border: none;
          padding: 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(30, 30, 45, 0.15);
          font-family: var(--font-family);
          outline: none;
        }

        /* --- Slide-up Bottom Sheet Modal --- */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(30, 30, 45, 0.5);
          backdrop-filter: blur(6px);
          z-index: 1000;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .modal-overlay.show {
          opacity: 1;
          pointer-events: auto;
        }

        .modal-card {
          background: var(--white);
          width: 100%;
          max-width: 480px;
          border-radius: 32px 32px 0 0;
          padding: 24px 20px;
          box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.08);
          transform: translateY(100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          text-align: center;
        }

        .modal-overlay.show .modal-card {
          transform: translateY(0);
        }

        .modal-title {
          color: var(--text-dark);
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .modal-subtitle {
          color: var(--text-gray);
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 20px;
          text-align: center;
        }

        .modal-divider {
          border: 0;
          height: 1px;
          background-color: var(--border-color);
          margin-bottom: 20px;
        }

        .stars {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .stars .material-symbols-outlined {
          font-size: 36px;
          color: #EFEFF5;
          cursor: pointer;
          font-variation-settings: 'FILL' 1;
          transition: color 0.15s ease, transform 0.15s ease;
        }

        .stars .material-symbols-outlined.active {
          color: var(--warning-yellow);
        }

        .review-input {
          width: 100%;
          background: #F8F8FC;
          border: 1px solid var(--border-color);
          border-radius: 16px;
          padding: 16px;
          font-size: 13px;
          font-family: var(--font-family);
          resize: none;
          height: 90px;
          margin-bottom: 20px;
          outline: none;
          color: var(--text-dark);
          text-align: left;
        }

        .btn-submit-close {
          width: 100%;
          background: linear-gradient(135deg, #DE468B, #A21CAF);
          color: var(--white);
          border: none;
          border-radius: 20px;
          padding: 16px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          font-family: var(--font-family);
          box-shadow: 0 4px 15px rgba(222, 70, 139, 0.3);
          outline: none;
        }
      `}</style>

      <div className="app-container">
        {/* Header Navigation */}
        <div className="header">
          <button onClick={() => navigate(-1)} className="icon-btn" aria-label="Go back">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="header-title">Digital Prescription</h1>
          <button onClick={handleShare} className="icon-btn" aria-label="Share prescription">
            <span className="material-symbols-outlined">share</span>
          </button>
        </div>

        {/* Doctor Identity Card */}
        <div className="doctor-card">
          <img 
            src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=150&q=80" 
            alt="Dr. Vikram Malhotra" 
            className="doctor-avatar" 
          />
          <div className="doctor-info">
            <h2>Dr. Vikram Malhotra</h2>
            <p>Senior Veterinarian</p>
            <div className="reg-id">
              <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>verified</span>
              REG ID: VET-88291
            </div>
          </div>
        </div>

        {/* Patient and Pet Card */}
        <div className="patient-card">
          <div className="avatar-container">
            <img 
              src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=150&q=80" 
              alt="Luna" 
              className="avatar" 
            />
            <div className="status-dot"></div>
          </div>
          <div className="patient-info">
            <h2>Prescription for Luna</h2>
            <div className="pet-breed">Dog • Golden Retriever</div>
            <p>3 Years Old • ID: #SRV-9921</p>
            <div className="tags">
              <span className="tag tag-primary">CONSULTATION: VIDEO CALL</span>
              <span className="tag tag-secondary">WEIGHT: 24KG</span>
            </div>
          </div>
        </div>

        {/* Prescription Meta Strip */}
        <div className="prescription-meta-strip">
          <div className="issue-date">
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>calendar_today</span>
            Issued on: June 18, 2026
          </div>
          <a href="#" onClick={handleViewPassport} className="passport-btn">
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>badge</span>
            View Pet Passport
          </a>
        </div>

        {/* Vital Parameters */}
        <div className="section-container">
          <div className="section-header-title">
            <span className="material-symbols-outlined">monitor_heart</span> Vital Parameters
          </div>
          <div className="vitals-row">
            <div className="vital-metric-card">
              <span className="metric-label">Temperature</span>
              <span className="metric-value">101.5 °F</span>
            </div>
            <div className="vital-metric-card">
              <span className="metric-label">Heart Rate</span>
              <span className="metric-value">80 bpm</span>
            </div>
          </div>
        </div>

        {/* Diagnosis Chips */}
        <div className="section-container">
          <div className="section-header-title">
            <span className="material-symbols-outlined">stethoscope</span> Diagnosis / Complaints
          </div>
          <div className="chips-inline-wrap">
            <div className="user-prescription-chip">Mild Dehydration</div>
            <div className="user-prescription-chip">Loss of Appetite</div>
          </div>
        </div>

        {/* Prescribed Medicines */}
        <div className="section-container">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <div className="section-header-title" style={{ marginBottom: 0 }}>
              <span className="material-symbols-outlined">medication</span> Prescribed Medicines
            </div>
            <a 
              href="#" 
              onClick={(e) => { e.preventDefault(); toast.info("Opening pharmacy medicine shop..."); }}
              className="shop-link"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>shopping_cart</span> SHOP ALL
            </a>
          </div>

          <div className="med-list">
            <div className="med-card">
              <div className="med-details">
                <img 
                  src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=100&q=80" 
                  alt="Pet-O-Boost" 
                  className="med-img" 
                />
                <div className="med-info">
                  <div className="med-header-row">
                    <h3 className="med-name">Pet-O-Boost</h3>
                    <span className="med-price">₹540</span>
                  </div>
                  <p className="med-desc">Multivitamin Supplement</p>
                  <div className="stock-status">IN STOCK <span>• 1 Pack (30 Tablets)</span></div>
                </div>
              </div>
              <button onClick={() => handleOrderMedicine("Pet-O-Boost")} className="btn-action">
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>shopping_cart</span> Order Now
              </button>
            </div>

            <div className="med-card">
              <div className="med-details">
                <img 
                  src="https://images.unsplash.com/photo-1550572017-edb3f5451e06?auto=format&fit=crop&w=100&q=80" 
                  alt="K-9 Calmer" 
                  className="med-img" 
                />
                <div className="med-info">
                  <div className="med-header-row">
                    <h3 className="med-name">K-9 Calmer</h3>
                    <span className="med-price">₹320</span>
                  </div>
                  <p className="med-desc">Anti-anxiety Oral Drops</p>
                  <div className="stock-status">IN STOCK <span>• 30ml Bottle</span></div>
                </div>
              </div>
              <button onClick={() => handleOrderMedicine("K-9 Calmer")} className="btn-action">
                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>shopping_cart</span> Order Now
              </button>
            </div>
          </div>
        </div>

        {/* Recommended Lab Tests */}
        <div className="section-container">
          <div className="section-header-title">
            <span className="material-symbols-outlined">biotech</span> Recommended Lab Tests
          </div>
          
          <div className="lab-card">
            <div className="lab-left">
              <div className="lab-icon">
                <span className="material-symbols-outlined">description</span>
              </div>
              <div className="lab-info">
                <h4>Complete Blood Count (CBC)</h4>
                <p>8-hour fasting required</p>
              </div>
            </div>
            <button onClick={() => handleBookLabTest("Complete Blood Count (CBC)")} className="btn-book">Book Home</button>
          </div>

          <div className="lab-card">
            <div className="lab-left">
              <div className="lab-icon">
                <span className="material-symbols-outlined">description</span>
              </div>
              <div className="lab-info">
                <h4>Urinalysis Panel</h4>
                <p>Next-day results available</p>
              </div>
            </div>
            <button onClick={() => handleBookLabTest("Urinalysis Panel")} className="btn-book">Book Home</button>
          </div>
        </div>

        {/* Administration Notes Card */}
        <div className="section-container">
          <div className="notes-card">
            <div className="notes-title">
              <span className="material-symbols-outlined">assignment</span> Administration Notes
            </div>
            <div className="note-item">
              <div className="note-num">1</div>
              <div className="note-text">Administer 1 tablet of <strong>Pet-O-Boost</strong> once daily mixed with morning meal.</div>
            </div>
            <div className="note-item">
              <div className="note-num">2</div>
              <div className="note-text">Give 0.5ml of <strong>K-9 Calmer</strong> drops directly in the mouth during high stress periods or before travel.</div>
            </div>
            <div className="note-item">
              <div className="note-num">3</div>
              <div className="note-text">Observe for any unusual behavior or gastrointestinal sensitivity during the first 3 days.</div>
            </div>
          </div>
        </div>

        {/* Clinical Findings & Summary */}
        <div className="section-container">
          <div className="section-header-title">
            <span className="material-symbols-outlined">subject</span> Clinical Findings & Summary
          </div>
          <div className="findings-summary-box">
            Patient shows signs of fatigue and mild dehydration due to recent climate changes. Vital vitals are stable but require structural multivitamin support over the week.
          </div>
        </div>

        {/* Reports & Attachments */}
        <div className="section-container">
          <div className="section-header-title">
            <span className="material-symbols-outlined">attach_file</span> Reports & Attachments
          </div>
          <div className="user-attachments-row">
            <div onClick={() => handleViewAttachment("Blood_Report_Luna.pdf")} className="attachment-view-card">
              <div className="attachment-meta">
                <span className="material-symbols-outlined file-icon" style={{ color: "#EF4444" }}>picture_as_pdf</span>
                <div>
                  <div className="file-title">Blood_Report_Luna.pdf</div>
                  <div className="file-size">1.4 MB</div>
                </div>
              </div>
              <span className="view-action-btn">VIEW</span>
            </div>
            <div onClick={() => handleViewAttachment("Thoracic_XRay_Luna.jpg")} className="attachment-view-card">
              <div className="attachment-meta">
                <span className="material-symbols-outlined file-icon" style={{ color: "var(--primary)" }}>image</span>
                <div>
                  <div className="file-title">Thoracic_XRay_Luna.jpg</div>
                  <div className="file-size">3.1 MB</div>
                </div>
              </div>
              <span className="view-action-btn">VIEW</span>
            </div>
          </div>
        </div>

        {/* Consultation Outcome */}
        <div className="section-container">
          <div className="section-header-title">
            <span className="material-symbols-outlined">assignment_turned_in</span> Consultation Outcome
          </div>
          <div className="outcome-card-display">
            <div className="outcome-indicator-dot"></div>
            <span>Consultation Confirmed</span>
          </div>
        </div>

        {/* Next Appointment Card */}
        <div className="section-container">
          <div className="appointment-card">
            <div>
              <div className="appt-label">Next Appointment</div>
              <div className="appt-date">November 15, 2026</div>
              <div className="appt-desc">Follow-up Checkup</div>
            </div>
            <div className="appt-icon">
              <span className="material-symbols-outlined">calendar_month</span>
            </div>
          </div>
        </div>

        {/* Premium Feedback Trigger Button */}
        <div className="feedback-trigger-zone">
          <button onClick={() => setIsFeedbackOpen(true)} className="btn-trigger-feedback">
            <span className="material-symbols-outlined">rate_review</span> Rate Consultation Experience
          </button>
        </div>
      </div>

      {/* Slide-up Rating Modal Overlay */}
      <div 
        className={cn("modal-overlay", isFeedbackOpen && "show")} 
        onClick={(e) => { if (e.target === e.currentTarget) setIsFeedbackOpen(false); }}
      >
        <div className="modal-card">
          <h3 className="modal-title">
            How was your experience?
            <span className="material-symbols-outlined" style={{ color: "var(--primary)" }}>pets</span>
          </h3>
          <p className="modal-subtitle">Your reviews help Dr. Vikram provide top tier care.</p>
          <hr className="modal-divider" />
          
          {/* Interactive Star Selection */}
          <div className="stars">
            {[1, 2, 3, 4, 5].map((num) => (
              <span 
                key={num} 
                className={cn("material-symbols-outlined star", rating >= num && "active")}
                onClick={() => setRating(num)}
                style={{ transform: rating >= num ? "scale(1.12)" : "scale(1)" }}
              >
                star
              </span>
            ))}
          </div>
          
          <textarea 
            className="review-input" 
            placeholder="Write an optional review about the consultation..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
          />
          <button className="btn-submit-close" onClick={submitFeedback}>Submit Feedback</button>
        </div>
      </div>
    </div>
  );
};

export default DigitalPrescription;
