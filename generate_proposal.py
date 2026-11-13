import os
import base64
import subprocess
import re
import sys

# Dynamic Paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SUPER_ADMIN_DIR = SCRIPT_DIR
BASE_DIR = os.path.dirname(SCRIPT_DIR)

LOGO_PATH = os.path.join(SUPER_ADMIN_DIR, "tropical_gyros_logo.png")
if not os.path.exists(LOGO_PATH):
    LOGO_PATH = os.path.join(BASE_DIR, "admin", "public", "images", "tropical_gyros_logo.png")

HTML_OUT_PATH = os.path.join(SUPER_ADMIN_DIR, "super_admin_proposal.html")
PDF_OUT_PATH = os.path.join(SUPER_ADMIN_DIR, "Tropical_Gyros_Super_Admin_Panel_Approval.pdf")

# Read logo base64
with open(LOGO_PATH, "rb") as f:
    logo_b64 = base64.b64encode(f.read()).decode("utf-8")
logo_data_uri = f"data:image/png;base64,{logo_b64}"

print("Building project-accurate Tropical Gyros Super Admin Proposal...")

html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Tropical Gyros — Super Admin Panel Approval Document</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    /* CSS RESET & EXACT A4 GEOMETRY */
    @page {{
      size: A4 portrait;
      margin: 0;
    }}
    *, *::before, *::after {{
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }}
    html, body {{
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: 'Poppins', 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1e293b;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
      font-size: 12.5px;
      line-height: 1.45;
    }}

    /* 7-PAGE CONTAINERS */
    .page {{
      width: 210mm;
      height: 297mm;
      min-height: 297mm;
      max-height: 297mm;
      margin: 0 auto;
      background: #ffffff;
      position: relative;
      page-break-after: always;
      page-break-inside: avoid;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    }}
    @media print {{
      body {{
        background: none;
      }}
      .page {{
        box-shadow: none;
        margin: 0;
        page-break-after: always !important;
      }}
    }}

    /* TROPICAL GYROS BRAND SYSTEM */
    :root {{
      --tropical-yellow: #F5C842;
      --tropical-amber: #D97706;
      --lime-green: #B8D94B;
      --deep-green: #064E3B;
      --emerald-dark: #065F46;
      --ocean-blue: #168BA5;
      --ocean-blue-light: #E0F2FE;
      --ocean-blue-dark: #0C4A6E;
      --deep-slate: #0F172A;
      --charcoal: #1E293B;
      --body-text: #334155;
      --muted-slate: #64748B;
      --card-bg: #FFFFFF;
      --card-border: #E2E8F0;
      --tag-yes: #10B981;
      --tag-no: #94A3B8;
    }}

    /* RUNNING HEADER (PAGES 2 - 7) */
    .page-header {{
      height: 19mm;
      padding: 4mm 16mm 3mm 16mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1.5px solid #E2E8F0;
      background: #FFFFFF;
      flex-shrink: 0;
    }}
    .header-left {{
      display: flex;
      align-items: center;
      gap: 12px;
    }}
    .header-logo {{
      height: 30px;
      width: auto;
      object-fit: contain;
    }}
    .header-title-block {{
      display: flex;
      flex-direction: column;
    }}
    .header-title {{
      font-size: 10.5px;
      font-weight: 700;
      color: var(--deep-slate);
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }}
    .header-subtitle {{
      font-size: 8.5px;
      font-weight: 500;
      color: var(--ocean-blue);
      letter-spacing: 0.3px;
    }}
    .header-badge {{
      display: inline-block;
      padding: 3px 9px;
      background: #F8FAFC;
      border: 1px solid #CBD5E1;
      border-radius: 20px;
      font-size: 8px;
      font-weight: 700;
      color: var(--charcoal);
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }}

    /* RUNNING FOOTER (PAGES 2 - 7) */
    .page-footer {{
      height: 13mm;
      padding: 2.5mm 16mm 3.5mm 16mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #E2E8F0;
      background: #FFFFFF;
      font-size: 8.5px;
      color: var(--muted-slate);
      flex-shrink: 0;
    }}
    .footer-left {{
      display: flex;
      align-items: center;
      gap: 8px;
    }}
    .footer-dot {{
      width: 4px;
      height: 4px;
      background: var(--tropical-yellow);
      border-radius: 50%;
    }}
    .footer-center {{
      font-weight: 500;
    }}
    .footer-right {{
      font-weight: 600;
      color: var(--deep-slate);
    }}

    /* PAGE CONTENT AREA */
    .page-body {{
      flex: 1;
      padding: 6mm 16mm;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }}

    /* SECTION TITLE BANNER */
    .section-title-wrap {{
      margin-bottom: 9px;
    }}
    .section-eyebrow {{
      font-size: 8.5px;
      font-weight: 700;
      text-transform: uppercase;
      color: var(--ocean-blue);
      letter-spacing: 1.2px;
      margin-bottom: 2px;
    }}
    .section-heading {{
      font-size: 17.5px;
      font-weight: 700;
      color: var(--deep-slate);
      line-height: 1.25;
    }}
    .section-desc {{
      font-size: 9.5px;
      color: var(--muted-slate);
      margin-top: 2px;
      line-height: 1.4;
    }}

    /* CARDS */
    .card {{
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 9px;
      padding: 10px 12px;
      margin-bottom: 8px;
      position: relative;
    }}
    .card-highlight {{
      background: linear-gradient(135deg, #FFFDF5 0%, #FFFFFF 100%);
      border: 1.5px solid var(--tropical-yellow);
    }}
    .card-blue {{
      background: linear-gradient(135deg, #F0F9FF 0%, #FFFFFF 100%);
      border: 1.5px solid #BAE6FD;
    }}
    .card-emerald {{
      background: linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 100%);
      border: 1.5px solid #A7F3D0;
    }}

    .card-title {{
      font-size: 11.5px;
      font-weight: 700;
      color: var(--deep-slate);
      margin-bottom: 3px;
      display: flex;
      align-items: center;
      gap: 6px;
    }}
    .card-desc {{
      font-size: 9px;
      color: var(--body-text);
      line-height: 1.42;
    }}

    /* BADGES & LABELS */
    .badge {{
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 8px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }}
    .badge-yellow {{
      background: #FEF3C7;
      color: #92400E;
      border: 1px solid #FCD34D;
    }}
    .badge-green {{
      background: #D1FAE5;
      color: #065F46;
      border: 1px solid #6EE7B7;
    }}
    .badge-blue {{
      background: #E0F2FE;
      color: #0369A1;
      border: 1px solid #7DD3FC;
    }}
    .badge-slate {{
      background: #F1F5F9;
      color: #334155;
      border: 1px solid #CBD5E1;
    }}
    .badge-proposed {{
      background: #F3E8FF;
      color: #6B21A8;
      border: 1px solid #D8B4FE;
      font-weight: 700;
    }}

    /* FEATURE BULLETS */
    .feature-list {{
      list-style: none;
      margin-top: 5px;
      display: flex;
      flex-direction: column;
      gap: 3.5px;
    }}
    .feature-item {{
      font-size: 9px;
      color: var(--body-text);
      display: flex;
      align-items: flex-start;
      gap: 5px;
      line-height: 1.38;
    }}
    .feature-item::before {{
      content: "•";
      color: var(--tropical-yellow);
      font-size: 12px;
      line-height: 1;
      margin-top: -1px;
    }}

    /* TABLES */
    .table-container {{
      width: 100%;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #E2E8F0;
      margin-top: 6px;
      margin-bottom: 6px;
    }}
    .custom-table {{
      width: 100%;
      border-collapse: collapse;
      font-size: 9px;
      text-align: left;
    }}
    .custom-table th {{
      background: #0F172A;
      color: #FFFFFF;
      font-weight: 600;
      padding: 7px 9px;
      font-size: 8.5px;
      letter-spacing: 0.4px;
      text-transform: uppercase;
    }}
    .custom-table td {{
      padding: 6px 9px;
      border-bottom: 1px solid #E2E8F0;
      color: var(--charcoal);
    }}
    .custom-table tr:nth-child(even) td {{
      background: #F8FAFC;
    }}
    .pill-yes {{
      background: #10B981;
      color: #FFFFFF;
      font-weight: 700;
      font-size: 7.5px;
      padding: 2px 7px;
      border-radius: 12px;
      display: inline-block;
      text-align: center;
      letter-spacing: 0.5px;
    }}
    .pill-no {{
      background: #E2E8F0;
      color: #64748B;
      font-weight: 600;
      font-size: 7.5px;
      padding: 2px 7px;
      border-radius: 12px;
      display: inline-block;
      text-align: center;
      letter-spacing: 0.5px;
    }}

    /* GRID UTILITIES */
    .grid-2 {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }}
    .grid-3 {{
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
    }}

    /* CALLOUT BOXES */
    .callout {{
      padding: 8px 11px;
      border-radius: 8px;
      font-size: 9px;
      line-height: 1.42;
      display: flex;
      gap: 9px;
      align-items: flex-start;
      margin-bottom: 8px;
    }}
    .callout-important {{
      background: #FEF9C3;
      border-left: 3.5px solid var(--tropical-yellow);
      color: #713F12;
    }}
    .callout-info {{
      background: #E0F2FE;
      border-left: 3.5px solid var(--ocean-blue);
      color: #075985;
    }}
  </style>
</head>
<body>

  <!-- =================================================================== -->
  <!-- PAGE 1: COVER PAGE                                                  -->
  <!-- =================================================================== -->
  <div class="page" id="page-1" style="background: radial-gradient(circle at 100% 0%, #FFFDF5 0%, #FFFFFF 60%, #F0F9FF 100%);">
    <!-- Top Geometric Accent Bar -->
    <div style="height: 7px; width: 100%; background: linear-gradient(90deg, #F5C842 0%, #B8D94B 50%, #168BA5 100%);"></div>

    <div style="flex: 1; padding: 18mm 20mm 14mm 20mm; display: flex; flex-direction: column; justify-content: space-between;">
      
      <!-- Top Branding Section -->
      <div>
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="background: #FFFFFF; padding: 10px 18px; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 4px 14px rgba(0,0,0,0.04); display: inline-block;">
            <img src="{logo_data_uri}" alt="Tropical Gyros Official Logo" style="height: 52px; width: auto; display: block;">
          </div>
          <div style="text-align: right;">
            <span class="badge badge-yellow" style="font-size: 8.5px; padding: 4px 9px; text-transform: uppercase; font-weight: 700; letter-spacing: 0.8px;">
              Executive Proposal
            </span>
            <div style="font-size: 8px; color: var(--muted-slate); margin-top: 4px; font-weight: 500;">
              Document Ref: TG-SAD-2026-V2
            </div>
          </div>
        </div>

        <!-- Cover Titles & Badges -->
        <div style="margin-top: 26px;">
          <div style="display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: #FEF3C7; border: 1px solid #FDE68A; border-radius: 20px; margin-bottom: 12px;">
            <span style="width: 6px; height: 6px; background: #D97706; border-radius: 50%;"></span>
            <span style="font-size: 9px; font-weight: 700; color: #92400E; text-transform: uppercase; letter-spacing: 1px;">
              System Architecture & Scope Approval
            </span>
          </div>

          <h1 style="font-size: 33px; font-weight: 800; color: var(--deep-slate); line-height: 1.15; letter-spacing: -0.5px;">
            SUPER ADMIN<br>PANEL
          </h1>

          <div style="font-size: 14.5px; font-weight: 700; color: var(--ocean-blue); letter-spacing: 1.4px; text-transform: uppercase; margin-top: 8px;">
            WORKFLOW & SCOPE SPECIFICATION
          </div>

          <p style="font-size: 10.5px; color: var(--body-text); line-height: 1.55; margin-top: 13px; max-width: 540px;">
            A centralized supervisory architecture designed for Tropical Gyros restaurant management approval. Introducing Admin account provisioning, custom permission assignments, and restaurant operational oversight while fully preserving the existing Next.js Admin Panel experience.
          </p>
        </div>

        <!-- 4 Key Project Realities -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 22px;">
          <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-left: 3px solid var(--tropical-yellow); border-radius: 8px; padding: 10px 12px;">
            <div style="font-size: 10px; font-weight: 700; color: var(--deep-slate);">1. Two Separate Web Panels</div>
            <div style="font-size: 8.5px; color: var(--muted-slate); margin-top: 3px; line-height: 1.4;">Super Admin functions as the master supervisory portal; the existing Admin Panel remains completely preserved for daily kitchen and order processing.</div>
          </div>
          <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-left: 3px solid var(--lime-green); border-radius: 8px; padding: 10px 12px;">
            <div style="font-size: 10px; font-weight: 700; color: var(--deep-slate);">2. Custom Permission Engine</div>
            <div style="font-size: 8.5px; color: var(--muted-slate); margin-top: 3px; line-height: 1.4;">Individually configure what each Admin can access and perform across Orders, Products, Categories, Payments, Staff, and Customers.</div>
          </div>
          <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-left: 3px solid var(--ocean-blue); border-radius: 8px; padding: 10px 12px;">
            <div style="font-size: 10px; font-weight: 700; color: var(--deep-slate);">3. True Tropical Gyros Workflow</div>
            <div style="font-size: 8.5px; color: var(--muted-slate); margin-top: 3px; line-height: 1.4;">Built specifically for BSD currency, strict 3.0-mile delivery limits, Cash on Delivery (COD) tracking, and unique customer barcode verification.</div>
          </div>
          <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-left: 3px solid var(--deep-green); border-radius: 8px; padding: 10px 12px;">
            <div style="font-size: 10px; font-weight: 700; color: var(--deep-slate);">4. Clear Implementation Roadmap</div>
            <div style="font-size: 8.5px; color: var(--muted-slate); margin-top: 3px; line-height: 1.4;">Transparently distinguishing existing frontend/localStorage prototype capabilities from proposed centralized backend integration features.</div>
          </div>
        </div>
      </div>

      <!-- Cover Bottom Metadata Card -->
      <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 11px; padding: 13px 17px; box-shadow: 0 4px 16px rgba(15,23,42,0.05);">
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; font-size: 8.5px;">
          <div>
            <div style="font-weight: 600; color: var(--muted-slate); text-transform: uppercase; font-size: 7.5px; letter-spacing: 0.5px;">Client Organization</div>
            <div style="font-weight: 700; color: var(--deep-slate); margin-top: 2px;">Tropical Gyros Management</div>
          </div>
          <div>
            <div style="font-weight: 600; color: var(--muted-slate); text-transform: uppercase; font-size: 7.5px; letter-spacing: 0.5px;">Document Purpose</div>
            <div style="font-weight: 700; color: var(--ocean-blue); margin-top: 2px;">Scope & Workflow Approval</div>
          </div>
          <div>
            <div style="font-weight: 600; color: var(--muted-slate); text-transform: uppercase; font-size: 7.5px; letter-spacing: 0.5px;">Proposal Version</div>
            <div style="font-weight: 700; color: var(--deep-slate); margin-top: 2px;">Version 2.0 (November 2026)</div>
          </div>
          <div>
            <div style="font-weight: 600; color: var(--muted-slate); text-transform: uppercase; font-size: 7.5px; letter-spacing: 0.5px;">Approval Status</div>
            <div style="font-weight: 700; color: #D97706; margin-top: 2px;">● Pending Client Review</div>
          </div>
        </div>
      </div>

      <!-- Cover Footer Note -->
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 8px; color: var(--muted-slate); border-top: 1px solid #E2E8F0; padding-top: 7px;">
        <span>Tropical Gyros Restaurant Management Project • Confidential Proposal</span>
        <span>A4 Specification Document • Exactly 7 Pages</span>
      </div>

    </div>
  </div>

  <!-- =================================================================== -->
  <!-- PAGE 2: PROJECT BACKGROUND & 2-PANEL ARCHITECTURE                   -->
  <!-- =================================================================== -->
  <div class="page" id="page-2">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <img src="{logo_data_uri}" alt="Logo" class="header-logo">
        <div class="header-title-block">
          <span class="header-title">Tropical Gyros Super Admin Proposal</span>
          <span class="header-subtitle">Project Architecture & System Evolution</span>
        </div>
      </div>
      <span class="header-badge">01 | Project Background</span>
    </div>

    <!-- Body -->
    <div class="page-body">
      <div class="section-title-wrap">
        <div class="section-eyebrow">Architecture Overview</div>
        <h2 class="section-heading">01. Project Background & 2-Panel Architecture</h2>
        <p class="section-desc">
          Contextualizing the actual Tropical Gyros restaurant applications and the introduction of centralized supervisory control.
        </p>
      </div>

      <!-- Current Ecosystem Section -->
      <div style="margin-bottom: 8px;">
        <div style="font-size: 10px; font-weight: 700; color: var(--deep-slate); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;">
          The Existing Tropical Gyros Ecosystem (Current 3 Pillars)
        </div>
        <div class="grid-3">
          <div class="card" style="margin-bottom: 0;">
            <div class="card-title" style="color: var(--ocean-blue);">
              <span style="display:inline-block; width:7px; height:7px; background:var(--ocean-blue); border-radius:50%;"></span>
              Customer Mobile App
            </div>
            <div style="font-size: 7.5px; font-weight: 600; color: var(--muted-slate); margin-bottom: 3px;">Flutter (iOS & Android)</div>
            <p class="card-desc">
              Customer food ordering with category sliders (Meat Gyros, Bowls, Salads, Smoothies), dish customizations, <strong>strict 3.0-mile delivery limit</strong>, dynamic QR and card checkout, and unique order barcode generation.
            </p>
          </div>

          <div class="card" style="margin-bottom: 0;">
            <div class="card-title" style="color: var(--lime-green);">
              <span style="display:inline-block; width:7px; height:7px; background:var(--lime-green); border-radius:50%;"></span>
              Delivery & Cashier App
            </div>
            <div style="font-size: 7.5px; font-weight: 600; color: var(--muted-slate); margin-bottom: 3px;">Flutter (iOS & Android)</div>
            <p class="card-desc">
              Operational mobile terminal with dual-role login (Delivery Driver & Counter Cashier). Features camera barcode scanner for pickup/handover verification and Cash on Delivery (COD) collection tracking.
            </p>
          </div>

          <div class="card" style="margin-bottom: 0;">
            <div class="card-title" style="color: var(--tropical-amber);">
              <span style="display:inline-block; width:7px; height:7px; background:var(--tropical-amber); border-radius:50%;"></span>
              Existing Admin Panel
            </div>
            <div style="font-size: 7.5px; font-weight: 600; color: var(--muted-slate); margin-bottom: 3px;">Next.js 16 + React 19 (Web)</div>
            <p class="card-desc">
              Operational web console deployed live on Vercel. Operates as the central kitchen workspace for orders, status updates, products in BSD currency, categories, delivery staff roster, and customer records.
            </p>
          </div>
        </div>
      </div>

      <!-- Critical Coexistence Callout Box -->
      <div class="callout callout-important" style="margin-top: 4px; margin-bottom: 8px;">
        <div style="font-size: 15px; line-height: 1;">⚠️</div>
        <div>
          <div style="font-weight: 700; font-size: 10px; color: #92400E; margin-bottom: 2px;">
            CORE ARCHITECTURAL DIRECTIVE: TWO SEPARATE WEB PANELS (NO REPLACEMENT)
          </div>
          <div style="font-size: 8.5px; line-height: 1.4; color: #78350F;">
            <strong>A. New Super Admin Panel:</strong> A dedicated new supervisory portal providing complete control over restaurant operations, Admin account creation, and granular permission assignments.<br>
            <strong>B. Existing Admin Panel:</strong> Must remain available as the existing Admin experience, preserving its current screens, UI, and day-to-day kitchen operations. Super Admin controls which modules each Admin can access.<br>
            <em>Important: No separate "Orders-only" Admin Panel is introduced in this proposal.</em>
          </div>
        </div>
      </div>

      <!-- Strategic Purpose of Super Admin -->
      <div style="margin-bottom: 8px;">
        <div style="font-size: 10px; font-weight: 700; color: var(--deep-slate); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;">
          Why the Super Admin Panel is Being Introduced
        </div>
        <div class="grid-2">
          <div class="card" style="margin-bottom: 0; padding: 8px 10px;">
            <div class="card-title" style="font-size: 10.5px;">1. Dedicated Admin Account Provisioning</div>
            <div class="card-desc">
              Currently, staff share local access. Super Admin will formally create, update, and activate/deactivate individual Admin accounts for kitchen supervisors, dispatchers, and cashiers.
            </div>
          </div>
          <div class="card" style="margin-bottom: 0; padding: 8px 10px;">
            <div class="card-title" style="font-size: 10.5px;">2. Modular Custom Permission Control</div>
            <div class="card-desc">
              Enables restaurant owners to individually toggle permissions (e.g. allowing front counter staff to print invoices while preventing them from editing food prices or deleting categories).
            </div>
          </div>
          <div class="card" style="margin-bottom: 0; padding: 8px 10px;">
            <div class="card-title" style="font-size: 10.5px;">3. BSD Financial & Payment Oversight</div>
            <div class="card-desc">
              Monitors all Cash on Delivery collections, un-remitted driver balances, card transactions, and total revenue calculated strictly in Bahamian Dollars (BSD).
            </div>
          </div>
          <div class="card" style="margin-bottom: 0; padding: 8px 10px;">
            <div class="card-title" style="font-size: 10.5px;">4. Action Attribution & Accountability</div>
            <div class="card-desc">
              Introduces operational activity logs to record which Admin performed specific actions (order status changes, price updates, driver assignments) with exact timestamps.
            </div>
          </div>
        </div>
      </div>

      <!-- Current State Transparency Note -->
      <div class="callout callout-info" style="margin-top: 2px; margin-bottom: 0;">
        <div style="font-size: 14px; line-height: 1;">ℹ️</div>
        <div>
          <div style="font-weight: 700; font-size: 9px; color: #075985; margin-bottom: 1px;">
            Implementation Transparency Note
          </div>
          <div style="font-size: 8px; line-height: 1.35; color: #0C4A6E;">
            The existing Admin Panel and Flutter apps currently operate with complete UI/UX implementations utilizing in-memory state and localStorage mock data. Centralized multi-admin authentication, dynamic permission enforcement, and live cross-panel synchronization represent <strong>PROPOSED ARCHITECTURE REQUIRING BACKEND INTEGRATION</strong> (e.g., Firebase, Supabase, or custom REST/WebSocket backend).
          </div>
        </div>
      </div>

    </div>

    <!-- Footer -->
    <div class="page-footer">
      <div class="footer-left">
        <span class="footer-dot"></span>
        <span>Tropical Gyros Proposal • TG-SAD-2026-V2</span>
      </div>
      <div class="footer-center">Confidential — For Internal Restaurant Management Review Only</div>
      <div class="footer-right">Page 2 of 7</div>
    </div>
  </div>

  <!-- =================================================================== -->
  <!-- PAGE 3: SUPER ADMIN CORE OPERATIONAL MODULES                        -->
  <!-- =================================================================== -->
  <div class="page" id="page-3">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <img src="{logo_data_uri}" alt="Logo" class="header-logo">
        <div class="header-title-block">
          <span class="header-title">Tropical Gyros Super Admin Proposal</span>
          <span class="header-subtitle">Modules 01 - 05 Specification</span>
        </div>
      </div>
      <span class="header-badge">02 | Core Modules</span>
    </div>

    <!-- Body -->
    <div class="page-body">
      <div class="section-title-wrap">
        <div class="section-eyebrow">Functional Scope</div>
        <h2 class="section-heading">02. Super Admin Core Operational Modules</h2>
        <p class="section-desc">
          Direct supervisory capabilities covering restaurant orders, food menu catalog, categories, and payment ledgers.
        </p>
      </div>

      <!-- Modules 01 - 05 -->
      <div style="display: flex; flex-direction: column; gap: 7px;">

        <!-- Module 01 -->
        <div class="card card-highlight" style="margin-bottom: 0; padding: 9px 11px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
            <div class="card-title" style="margin-bottom: 0; font-size: 11px; color: #92400E;">
              01. Complete Dashboard & Analytics
            </div>
            <span class="badge badge-yellow">Operational Overview</span>
          </div>
          <p class="card-desc" style="font-size: 8.5px; margin-bottom: 5px;">
            Provides management with a consolidated overview of restaurant operations, sales velocity, and order pipeline health.
          </p>
          <div class="grid-2" style="gap: 6px;">
            <ul class="feature-list" style="margin-top: 0;">
              <li class="feature-item"><strong>Overall Restaurant Performance:</strong> Monitor active operations across kitchen and dispatch.</li>
              <li class="feature-item"><strong>Daily Sales Summary:</strong> Total revenue calculated strictly in Bahamian Dollars (BSD).</li>
              <li class="feature-item"><strong>Total Orders Funnel:</strong> Track orders across Pending, Preparing, Dispatched, Delivered, Completed.</li>
            </ul>
            <ul class="feature-list" style="margin-top: 0;">
              <li class="feature-item"><strong>Payment Breakdown:</strong> Distribution of Cash on Delivery (COD) vs Card vs QR vs Apple Pay.</li>
              <li class="feature-item"><strong>Pending & Active Orders:</strong> Immediate count of orders awaiting kitchen acceptance.</li>
              <li class="feature-item"><strong>Operational Analytics:</strong> Overview of order completion volume and delivery fulfillment.</li>
            </ul>
          </div>
        </div>

        <!-- Module 02 -->
        <div class="card" style="margin-bottom: 0; padding: 9px 11px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
            <div class="card-title" style="margin-bottom: 0; font-size: 11px; color: var(--deep-slate);">
              02. Orders Management
            </div>
            <span class="badge badge-blue">Full Control</span>
          </div>
          <p class="card-desc" style="font-size: 8.5px; margin-bottom: 5px;">
            Super Admin maintains full access and override authority across all customer orders placed in the ecosystem.
          </p>
          <div class="grid-2" style="gap: 6px;">
            <ul class="feature-list" style="margin-top: 0;">
              <li class="feature-item"><strong>View All Orders:</strong> Unrestricted access to active, delivered, and cancelled orders.</li>
              <li class="feature-item"><strong>Order Details & Customizations:</strong> View items, special notes, spiciness, and delivery address.</li>
              <li class="feature-item"><strong>Order Status Progression:</strong> Update status (Pending → Preparing → Dispatched → Delivered).</li>
            </ul>
            <ul class="feature-list" style="margin-top: 0;">
              <li class="feature-item"><strong>Assign Delivery Staff:</strong> Select and assign available couriers to delivery orders.</li>
              <li class="feature-item"><strong>Order Barcode Tracking:</strong> Inspect unique barcode strings (e.g. TRP-884920-BC).</li>
              <li class="feature-item"><strong>Order Operations:</strong> Cancel orders with reason, print customer receipts and kitchen tickets.</li>
            </ul>
          </div>
        </div>

        <!-- 2 Column Modules (03 & 04) -->
        <div class="grid-2" style="gap: 7px;">
          <!-- Module 03 -->
          <div class="card" style="margin-bottom: 0; padding: 9px 11px;">
            <div class="card-title" style="font-size: 11px; color: var(--deep-slate);">
              03. Products Management
            </div>
            <p class="card-desc" style="font-size: 8.5px; margin-bottom: 4px;">
              Master control over the Tropical Gyros food menu, prices, and stock.
            </p>
            <ul class="feature-list" style="margin-top: 0;">
              <li class="feature-item"><strong>Add, Edit & Delete Dishes:</strong> Manage menu items, descriptions, and photos.</li>
              <li class="feature-item"><strong>BSD Pricing Control:</strong> Update food prices strictly in Bahamian Dollars (BSD).</li>
              <li class="feature-item"><strong>Stock Availability:</strong> Toggle items "In Stock" or "Sold Out" instantly.</li>
              <li class="feature-item"><strong>Dish Customization:</strong> Configure spiciness levels and ingredients list.</li>
            </ul>
          </div>

          <!-- Module 04 -->
          <div class="card" style="margin-bottom: 0; padding: 9px 11px;">
            <div class="card-title" style="font-size: 11px; color: var(--deep-slate);">
              04. Categories Management
            </div>
            <p class="card-desc" style="font-size: 8.5px; margin-bottom: 4px;">
              Manage menu categories with built-in duplicate prevention integrity.
            </p>
            <ul class="feature-list" style="margin-top: 0;">
              <li class="feature-item"><strong>Add, Edit & Delete Categories:</strong> Organize Gyros, Bowls, Salads, Smoothies.</li>
              <li class="feature-item"><strong>Duplicate Prevention Engine:</strong> Case-insensitive & trimmed space check blocks duplicates (e.g. "meat gyros" vs "Meat Gyros").</li>
              <li class="feature-item"><strong>Category Display Order:</strong> Manage display sequence on customer app.</li>
              <li class="feature-item"><strong>Category Active Switch:</strong> Temporarily hide or activate menu sections.</li>
            </ul>
          </div>
        </div>

        <!-- Module 05 -->
        <div class="card card-emerald" style="margin-bottom: 0; padding: 9px 11px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
            <div class="card-title" style="margin-bottom: 0; font-size: 11px; color: var(--deep-green);">
              05. Payments & COD Management
            </div>
            <span class="badge badge-green">Financial Oversight</span>
          </div>
          <p class="card-desc" style="font-size: 8.5px; margin-bottom: 5px;">
            Comprehensive visibility over payment statuses, methods, and Cash on Delivery collections.
          </p>
          <div class="grid-2" style="gap: 6px;">
            <ul class="feature-list" style="margin-top: 0;">
              <li class="feature-item"><strong>Payment Information:</strong> Monitor transaction statuses (Paid, Pending, Failed).</li>
              <li class="feature-item"><strong>Payment Methods:</strong> Review breakdown across COD, Card, Apple Pay, QR.</li>
            </ul>
            <ul class="feature-list" style="margin-top: 0;">
              <li class="feature-item"><strong>COD Collection Records:</strong> Track cash collected by couriers in the field.</li>
              <li class="feature-item"><strong>Mark Cash Received:</strong> Verify and record cash remitted at the restaurant counter.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>

    <!-- Footer -->
    <div class="page-footer">
      <div class="footer-left">
        <span class="footer-dot"></span>
        <span>Tropical Gyros Proposal • TG-SAD-2026-V2</span>
      </div>
      <div class="footer-center">Confidential — For Internal Restaurant Management Review Only</div>
      <div class="footer-right">Page 3 of 7</div>
    </div>
  </div>

  <!-- =================================================================== -->
  <!-- PAGE 4: STAFF, CUSTOMER & ADMIN MANAGEMENT                          -->
  <!-- =================================================================== -->
  <div class="page" id="page-4">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <img src="{logo_data_uri}" alt="Logo" class="header-logo">
        <div class="header-title-block">
          <span class="header-title">Tropical Gyros Super Admin Proposal</span>
          <span class="header-subtitle">Modules 06 - 08 Specification</span>
        </div>
      </div>
      <span class="header-badge">03 | Staff & Access</span>
    </div>

    <!-- Body -->
    <div class="page-body">
      <div class="section-title-wrap">
        <div class="section-eyebrow">Personnel Governance</div>
        <h2 class="section-heading">03. Delivery Staff, Customer & Admin Management</h2>
        <p class="section-desc">
          Managing restaurant delivery drivers, registered customer accounts, and provisioning Admin access.
        </p>
      </div>

      <!-- Modules 06, 07, 08 -->
      <div style="display: flex; flex-direction: column; gap: 8px;">

        <!-- Module 06: Delivery Staff -->
        <div class="card" style="margin-bottom: 0; padding: 10px 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
            <div class="card-title" style="font-size: 11.5px; color: var(--deep-slate);">
              06. Delivery Staff Management
            </div>
            <span class="badge badge-blue">Driver Operations</span>
          </div>
          <p class="card-desc" style="font-size: 8.5px; margin-bottom: 5px;">
            Manage delivery staff operating the Tropical Gyros Delivery & Cashier mobile app.
          </p>
          <div class="grid-2" style="gap: 6px;">
            <ul class="feature-list" style="margin-top: 0;">
              <li class="feature-item"><strong>Add & Edit Delivery Staff:</strong> Maintain driver name, phone number, and email.</li>
              <li class="feature-item"><strong>Vehicle Records:</strong> Record vehicle type (Scooter, Bike, Car) and vehicle plate number.</li>
              <li class="feature-item"><strong>Account Status Toggles:</strong> Activate or deactivate driver accounts for shift control.</li>
            </ul>
            <ul class="feature-list" style="margin-top: 0;">
              <li class="feature-item"><strong>Availability Status:</strong> Monitor driver status (Available, On Delivery, Offline).</li>
              <li class="feature-item"><strong>Delivery Assignments:</strong> View active orders currently assigned to each driver.</li>
              <li class="feature-item"><strong>Delivery Activity:</strong> Track total completed deliveries and COD cash collection status.</li>
            </ul>
          </div>
        </div>

        <!-- Module 07: Customer Management -->
        <div class="card" style="margin-bottom: 0; padding: 10px 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
            <div class="card-title" style="font-size: 11.5px; color: var(--deep-slate);">
              07. Customer Management
            </div>
            <span class="badge badge-slate">Customer Records</span>
          </div>
          <p class="card-desc" style="font-size: 8.5px; margin-bottom: 5px;">
            Access and manage customer records registered through the Customer mobile application.
          </p>
          <div class="grid-2" style="gap: 6px;">
            <ul class="feature-list" style="margin-top: 0;">
              <li class="feature-item"><strong>View Customer Records:</strong> Searchable list of customer names, emails, and phone numbers.</li>
              <li class="feature-item"><strong>Customer Details & Addresses:</strong> Inspect saved delivery addresses within the 3-mile perimeter.</li>
            </ul>
            <ul class="feature-list" style="margin-top: 0;">
              <li class="feature-item"><strong>Customer Order History:</strong> Complete chronological log of customer orders and totals in BSD.</li>
              <li class="feature-item"><strong>Manage Customer Accounts:</strong> Toggle customer status between active and banned.</li>
            </ul>
          </div>
        </div>

        <!-- Module 08: Admin Management (Master Feature) -->
        <div class="card card-highlight" style="margin-bottom: 0; padding: 11px 13px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
            <div class="card-title" style="font-size: 12px; color: #92400E;">
              08. Admin Management & Access Governance
            </div>
            <span class="badge badge-yellow">Central Authority</span>
          </div>
          <p class="card-desc" style="font-size: 8.5px; margin-bottom: 7px;">
            Super Admin creates and governs Admin accounts for staff members who operate the existing Admin Panel.
          </p>

          <div class="grid-2" style="gap: 7px;">
            <div style="background: #FFFFFF; border: 1px solid #FDE68A; border-radius: 7px; padding: 7px 9px;">
              <div style="font-size: 9.5px; font-weight: 700; color: #92400E; margin-bottom: 3px;">Admin Account Controls</div>
              <ul class="feature-list" style="margin-top: 0;">
                <li class="feature-item"><strong>Create Admin Accounts:</strong> Provision new accounts for kitchen leads, counter cashiers, and dispatchers.</li>
                <li class="feature-item"><strong>View Admin Accounts:</strong> Review staff list, phone, email, assigned role, and status.</li>
                <li class="feature-item"><strong>Edit Admin Information:</strong> Update name, contact details, or assigned operational duties.</li>
                <li class="feature-item"><strong>Activate / Deactivate Accounts:</strong> Instant toggle to suspend Admin login access.</li>
              </ul>
            </div>

            <div style="background: #FFFFFF; border: 1px solid #FDE68A; border-radius: 7px; padding: 7px 9px;">
              <div style="font-size: 9.5px; font-weight: 700; color: #92400E; margin-bottom: 3px;">Relationship to Existing Admin Panel</div>
              <ul class="feature-list" style="margin-top: 0;">
                <li class="feature-item"><strong>Existing Panel Preservation:</strong> The existing Admin Panel remains available for daily use.</li>
                <li class="feature-item"><strong>Permission Enforcement:</strong> Super Admin controls access to each screen via custom permissions.</li>
                <li class="feature-item"><strong>Review Assigned Permissions:</strong> Immediate view of active rights granted to each Admin.</li>
                <li class="feature-item"><strong>No Self-Elevation:</strong> Admins cannot grant themselves permissions or alter other accounts.</li>
              </ul>
            </div>
          </div>
        </div>

      </div>

      <!-- Coexistence Notice -->
      <div style="margin-top: 6px; background: #F8FAFC; border: 1px dashed #CBD5E1; border-radius: 7px; padding: 7px 11px; display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 14px;">🔒</span>
        <div style="font-size: 8px; color: var(--body-text); line-height: 1.35;">
          <strong>Security Principle:</strong> Regular Admins log into the existing Admin Panel and can only see or interact with features authorized by the Super Admin. Only the Super Admin possesses access to the Admin Management and Permission Engine.
        </div>
      </div>

    </div>

    <!-- Footer -->
    <div class="page-footer">
      <div class="footer-left">
        <span class="footer-dot"></span>
        <span>Tropical Gyros Proposal • TG-SAD-2026-V2</span>
      </div>
      <div class="footer-center">Confidential — For Internal Restaurant Management Review Only</div>
      <div class="footer-right">Page 4 of 7</div>
    </div>
  </div>

  <!-- =================================================================== -->
  <!-- PAGE 5: CUSTOM ROLES & GRANULAR PERMISSIONS                         -->
  <!-- =================================================================== -->
  <div class="page" id="page-5">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <img src="{logo_data_uri}" alt="Logo" class="header-logo">
        <div class="header-title-block">
          <span class="header-title">Tropical Gyros Super Admin Proposal</span>
          <span class="header-subtitle">Module 09 Specification & Matrix</span>
        </div>
      </div>
      <span class="header-badge">04 | Custom Permissions</span>
    </div>

    <!-- Body -->
    <div class="page-body">
      <div class="section-title-wrap">
        <div class="section-eyebrow">Access Governance</div>
        <h2 class="section-heading">04. Custom Roles & Granular Permissions</h2>
        <p class="section-desc">
          Super Admin decides exactly what each Admin can access and perform in the existing Admin Panel.
        </p>
      </div>

      <!-- Permission Architecture Box -->
      <div class="card card-blue" style="margin-bottom: 7px; padding: 8px 11px;">
        <div class="card-title" style="font-size: 10.5px; color: var(--ocean-blue-dark); margin-bottom: 2px;">
          Granular Permission Architecture (Module 09)
        </div>
        <p class="card-desc" style="font-size: 8.5px; line-height: 1.38;">
          Instead of rigid, hard-coded roles, the Super Admin Panel introduces <strong>modular capability toggles</strong>. Management can individually enable, modify, or revoke specific operational permissions per Admin account matching their exact shift responsibilities.
        </p>
      </div>

      <!-- 6 Permission Categories Grid -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 7px;">
        <div class="card" style="margin-bottom: 0; padding: 6px 8px;">
          <div style="font-size: 9px; font-weight: 700; color: var(--deep-slate); margin-bottom: 2px;">1. ORDERS PERMISSIONS</div>
          <div style="font-size: 7.5px; color: var(--body-text); line-height: 1.3;">
            • View Orders<br>
            • View Order Details<br>
            • Update Order Status<br>
            • Assign Delivery Staff<br>
            • Cancel Orders<br>
            • Print Invoice<br>
            • Export Orders
          </div>
        </div>

        <div class="card" style="margin-bottom: 0; padding: 6px 8px;">
          <div style="font-size: 9px; font-weight: 700; color: var(--deep-slate); margin-bottom: 2px;">2. PRODUCTS PERMISSIONS</div>
          <div style="font-size: 7.5px; color: var(--body-text); line-height: 1.3;">
            • View Products<br>
            • Add Products<br>
            • Edit Products<br>
            • Delete Products<br>
            • Update Stock Availability
          </div>
        </div>

        <div class="card" style="margin-bottom: 0; padding: 6px 8px;">
          <div style="font-size: 9px; font-weight: 700; color: var(--deep-slate); margin-bottom: 2px;">3. CATEGORIES PERMISSIONS</div>
          <div style="font-size: 7.5px; color: var(--body-text); line-height: 1.3;">
            • View Categories<br>
            • Add Categories<br>
            • Edit Categories<br>
            • Delete Categories
          </div>
        </div>

        <div class="card" style="margin-bottom: 0; padding: 6px 8px;">
          <div style="font-size: 9px; font-weight: 700; color: var(--deep-slate); margin-bottom: 2px;">4. PAYMENTS PERMISSIONS</div>
          <div style="font-size: 7.5px; color: var(--body-text); line-height: 1.3;">
            • View Payments<br>
            • View Transactions<br>
            • Mark Cash Received
          </div>
        </div>

        <div class="card" style="margin-bottom: 0; padding: 6px 8px;">
          <div style="font-size: 9px; font-weight: 700; color: var(--deep-slate); margin-bottom: 2px;">5. DELIVERY STAFF PERMISSIONS</div>
          <div style="font-size: 7.5px; color: var(--body-text); line-height: 1.3;">
            • View Staff<br>
            • Add Staff<br>
            • Edit Staff<br>
            • Manage Assignments
          </div>
        </div>

        <div class="card" style="margin-bottom: 0; padding: 6px 8px;">
          <div style="font-size: 9px; font-weight: 700; color: var(--deep-slate); margin-bottom: 2px;">6. CUSTOMERS PERMISSIONS</div>
          <div style="font-size: 7.5px; color: var(--body-text); line-height: 1.3;">
            • View Customers<br>
            • View Customer Details<br>
            • Manage Customer Accounts
          </div>
        </div>
      </div>

      <!-- Custom Admin Permission Comparison Example Table -->
      <div style="margin-top: 2px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 3px;">
          <div style="font-size: 9.5px; font-weight: 700; color: var(--deep-slate); text-transform: uppercase; letter-spacing: 0.5px;">
            Custom Admin Permission Example (Illustrative Configuration)
          </div>
          <span style="font-size: 7.5px; color: var(--muted-slate); font-style: italic;">
            * Illustrative example only; not a final permission configuration
          </span>
        </div>

        <div class="table-container" style="margin-top: 0; margin-bottom: 5px;">
          <table class="custom-table">
            <thead>
              <tr>
                <th style="width: 37%;">Permission</th>
                <th style="width: 21%; text-align: center;">Admin A</th>
                <th style="width: 21%; text-align: center;">Admin B</th>
                <th style="width: 21%; text-align: center;">Admin C</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>View Orders</strong></td>
                <td style="text-align: center;"><span class="pill-yes">YES</span></td>
                <td style="text-align: center;"><span class="pill-yes">YES</span></td>
                <td style="text-align: center;"><span class="pill-yes">YES</span></td>
              </tr>
              <tr>
                <td><strong>Update Status</strong></td>
                <td style="text-align: center;"><span class="pill-no">NO</span></td>
                <td style="text-align: center;"><span class="pill-yes">YES</span></td>
                <td style="text-align: center;"><span class="pill-yes">YES</span></td>
              </tr>
              <tr>
                <td><strong>Assign Driver</strong></td>
                <td style="text-align: center;"><span class="pill-no">NO</span></td>
                <td style="text-align: center;"><span class="pill-no">NO</span></td>
                <td style="text-align: center;"><span class="pill-yes">YES</span></td>
              </tr>
              <tr>
                <td><strong>Cancel Orders</strong></td>
                <td style="text-align: center;"><span class="pill-no">NO</span></td>
                <td style="text-align: center;"><span class="pill-no">NO</span></td>
                <td style="text-align: center;"><span class="pill-no">NO</span></td>
              </tr>
              <tr>
                <td><strong>Print Invoice</strong></td>
                <td style="text-align: center;"><span class="pill-yes">YES</span></td>
                <td style="text-align: center;"><span class="pill-yes">YES</span></td>
                <td style="text-align: center;"><span class="pill-yes">YES</span></td>
              </tr>
              <tr>
                <td><strong>View Payments</strong></td>
                <td style="text-align: center;"><span class="pill-no">NO</span></td>
                <td style="text-align: center;"><span class="pill-no">NO</span></td>
                <td style="text-align: center;"><span class="pill-yes">YES</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="font-size: 8px; color: var(--muted-slate); line-height: 1.35; padding: 4px 6px; background: #F8FAFC; border-radius: 6px;">
          <strong>Dynamic Control:</strong> Permissions are individually controlled by the Super Admin according to each Admin's operational responsibilities. Super Admin can modify or revoke permissions whenever required.
        </div>
      </div>

    </div>

    <!-- Footer -->
    <div class="page-footer">
      <div class="footer-left">
        <span class="footer-dot"></span>
        <span>Tropical Gyros Proposal • TG-SAD-2026-V2</span>
      </div>
      <div class="footer-center">Confidential — For Internal Restaurant Management Review Only</div>
      <div class="footer-right">Page 5 of 7</div>
    </div>
  </div>

  <!-- =================================================================== -->
  <!-- PAGE 6: WORKFLOW & SYSTEM ACCESS STRUCTURE                          -->
  <!-- =================================================================== -->
  <div class="page" id="page-6">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <img src="{logo_data_uri}" alt="Logo" class="header-logo">
        <div class="header-title-block">
          <span class="header-title">Tropical Gyros Super Admin Proposal</span>
          <span class="header-subtitle">Workflow & System Access Structure</span>
        </div>
      </div>
      <span class="header-badge">05 | Workflow Architecture</span>
    </div>

    <!-- Body -->
    <div class="page-body">
      <div class="section-title-wrap">
        <div class="section-eyebrow">Operational Topology</div>
        <h2 class="section-heading">05. Super Admin Workflow & System Access Structure</h2>
        <p class="section-desc">
          Operational workflow sequence illustrating the clear separation between Super Admin governance and Admin execution.
        </p>
      </div>

      <!-- WORKFLOW DIAGRAM (SVG VECTOR RENDERING) -->
      <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 9px; padding: 9px 11px; margin-bottom: 9px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
          <div style="font-size: 10px; font-weight: 700; color: var(--deep-slate); text-transform: uppercase; letter-spacing: 0.5px;">
            Super Admin & Admin Workflow Sequence
          </div>
          <div style="display: flex; gap: 8px; font-size: 7.5px;">
            <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 7px; height: 7px; background: #F5C842; border-radius: 2px;"></span> Super Admin Steps</span>
            <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 7px; height: 7px; background: #10B981; border-radius: 2px;"></span> Regular Admin Steps</span>
            <span style="display: flex; align-items: center; gap: 4px;"><span style="width: 7px; height: 7px; background: #168BA5; border-radius: 2px;"></span> Monitoring Step</span>
          </div>
        </div>

        <!-- SVG Sequence Diagram Following Prompt Section 7 -->
        <svg viewBox="0 0 680 185" style="width: 100%; height: auto; display: block; font-family: 'Poppins', sans-serif;">
          <!-- Defs for arrows -->
          <defs>
            <marker id="arrow-gold" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#D97706" />
            </marker>
            <marker id="arrow-green" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#059669" />
            </marker>
            <marker id="arrow-blue" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 1 L 8 5 L 0 9 z" fill="#0284C7" />
            </marker>
          </defs>

          <!-- ROW 1: Super Admin Domain (Steps 1, 2, 3, 4) -->
          <!-- Step 1: Super Admin Login -->
          <g transform="translate(10, 10)">
            <rect width="145" height="38" rx="6" fill="#FEF3C7" stroke="#F5C842" stroke-width="1.5" />
            <text x="72" y="16" font-size="8.5" font-weight="700" fill="#92400E" text-anchor="middle">SUPER ADMIN LOGIN</text>
            <text x="72" y="28" font-size="7" fill="#B45309" text-anchor="middle">Master Authentication</text>
          </g>

          <line x1="155" y1="29" x2="180" y2="29" stroke="#D97706" stroke-width="1.5" marker-end="url(#arrow-gold)" />

          <!-- Step 2: Super Admin Dashboard -->
          <g transform="translate(180, 10)">
            <rect width="145" height="38" rx="6" fill="#FEF3C7" stroke="#F5C842" stroke-width="1.5" />
            <text x="72" y="16" font-size="8.5" font-weight="700" fill="#92400E" text-anchor="middle">SUPER ADMIN DASHBOARD</text>
            <text x="72" y="28" font-size="7" fill="#B45309" text-anchor="middle">Revenue & Order Metrics</text>
          </g>

          <line x1="325" y1="29" x2="350" y2="29" stroke="#D97706" stroke-width="1.5" marker-end="url(#arrow-gold)" />

          <!-- Step 3: View Tropical Gyros Operations -->
          <g transform="translate(350, 10)">
            <rect width="150" height="38" rx="6" fill="#FEF3C7" stroke="#F5C842" stroke-width="1.5" />
            <text x="75" y="15" font-size="8" font-weight="700" fill="#92400E" text-anchor="middle">VIEW TROPICAL GYROS</text>
            <text x="75" y="27" font-size="7" fill="#B45309" text-anchor="middle">Live Operations & Catalog</text>
          </g>

          <line x1="500" y1="29" x2="525" y2="29" stroke="#D97706" stroke-width="1.5" marker-end="url(#arrow-gold)" />

          <!-- Step 4: Manage Existing Admin Accounts -->
          <g transform="translate(525, 10)">
            <rect width="145" height="38" rx="6" fill="#FEF3C7" stroke="#F5C842" stroke-width="1.5" />
            <text x="72" y="15" font-size="8" font-weight="700" fill="#92400E" text-anchor="middle">MANAGE ADMIN ACCOUNTS</text>
            <text x="72" y="27" font-size="7" fill="#B45309" text-anchor="middle">Create & Manage Accounts</text>
          </g>

          <!-- Connecting curve down from Step 4 to Step 5 -->
          <path d="M 597 48 L 597 65 L 597 72" stroke="#D97706" stroke-width="1.5" fill="none" marker-end="url(#arrow-gold)" />

          <!-- ROW 2: Permission Assignment (Step 5) -->
          <!-- Step 5: Assign Custom Permissions -->
          <g transform="translate(380, 72)">
            <rect width="290" height="38" rx="6" fill="#FEF3C7" stroke="#F5C842" stroke-width="1.5" />
            <text x="145" y="16" font-size="8.5" font-weight="700" fill="#92400E" text-anchor="middle">ASSIGN CUSTOM PERMISSIONS</text>
            <text x="145" y="28" font-size="7" fill="#B45309" text-anchor="middle">Granular Module & Action Toggles for Each Admin</text>
          </g>

          <!-- Connecting curve down to Step 6 (Admin Domain) -->
          <path d="M 380 91 L 180 91 L 180 125 L 82 125 L 82 134" stroke="#059669" stroke-width="1.5" fill="none" marker-end="url(#arrow-green)" />

          <!-- ROW 3: Regular Admin Execution & Super Admin Monitoring (Steps 6, 7, 8, 9) -->
          <!-- Step 6: Admin Login -->
          <g transform="translate(10, 134)">
            <rect width="145" height="38" rx="6" fill="#D1FAE5" stroke="#10B981" stroke-width="1.5" />
            <text x="72" y="15" font-size="8" font-weight="700" fill="#065F46" text-anchor="middle">ADMIN LOGS IN</text>
            <text x="72" y="27" font-size="7" fill="#047857" text-anchor="middle">Existing Admin Panel</text>
          </g>

          <line x1="155" y1="153" x2="175" y2="153" stroke="#059669" stroke-width="1.5" marker-end="url(#arrow-green)" />

          <!-- Step 7: Authorized Modules Only -->
          <g transform="translate(175, 134)">
            <rect width="150" height="38" rx="6" fill="#D1FAE5" stroke="#10B981" stroke-width="1.5" />
            <text x="75" y="15" font-size="8" font-weight="700" fill="#065F46" text-anchor="middle">AUTHORIZED MODULES</text>
            <text x="75" y="27" font-size="7" fill="#047857" text-anchor="middle">Access Only Permitted Tabs</text>
          </g>

          <line x1="325" y1="153" x2="345" y2="153" stroke="#059669" stroke-width="1.5" marker-end="url(#arrow-green)" />

          <!-- Step 8: Permitted Operations -->
          <g transform="translate(345, 134)">
            <rect width="155" height="38" rx="6" fill="#D1FAE5" stroke="#10B981" stroke-width="1.5" />
            <text x="77" y="15" font-size="8" font-weight="700" fill="#065F46" text-anchor="middle">PERMITTED OPERATIONS</text>
            <text x="77" y="27" font-size="7" fill="#047857" text-anchor="middle">Process Orders, Update Status</text>
          </g>

          <line x1="500" y1="153" x2="520" y2="153" stroke="#0284C7" stroke-width="1.5" marker-end="url(#arrow-blue)" />

          <!-- Step 9: Reviews Activity Logs -->
          <g transform="translate(520, 134)">
            <rect width="150" height="38" rx="6" fill="#E0F2FE" stroke="#168BA5" stroke-width="1.5" />
            <text x="75" y="15" font-size="8" font-weight="700" fill="#0C4A6E" text-anchor="middle">REVIEWS ACTIVITY LOGS</text>
            <text x="75" y="27" font-size="7" fill="#0369A1" text-anchor="middle">Super Admin Audits Actions</text>
          </g>
        </svg>
      </div>

      <!-- SYSTEM ACCESS STRUCTURE (COMPARATIVE BLUEPRINT) -->
      <div>
        <div style="font-size: 10px; font-weight: 700; color: var(--deep-slate); margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;">
          System Access Structure
        </div>

        <div class="grid-2" style="gap: 9px;">
          <!-- Card 1: Super Admin Panel -->
          <div class="card card-highlight" style="margin-bottom: 0; padding: 10px 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
              <div class="card-title" style="font-size: 11.5px; color: #92400E; margin-bottom: 0;">
                SUPER ADMIN PANEL
              </div>
              <span class="badge badge-yellow">Master Authority</span>
            </div>
            <div style="font-size: 8px; font-weight: 600; color: #B45309; margin-bottom: 5px;">New Dedicated Supervisory Console</div>
            <ul class="feature-list" style="margin-top: 0; gap: 4px;">
              <li class="feature-item"><strong>Complete Restaurant Control:</strong> Full supervisory oversight of operations.</li>
              <li class="feature-item"><strong>Full Module Access:</strong> Orders, Products, Categories, Payments, Staff, Customers, Settings.</li>
              <li class="feature-item"><strong>Admin Account Management:</strong> Create, edit, activate and deactivate Admin accounts.</li>
              <li class="feature-item"><strong>Custom Permission Management:</strong> Configure granular permission rights per Admin.</li>
              <li class="feature-item"><strong>Activity Monitoring:</strong> Review operational actions and timestamps.</li>
            </ul>
          </div>

          <!-- Card 2: Existing Admin Panel -->
          <div class="card card-emerald" style="margin-bottom: 0; padding: 10px 12px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
              <div class="card-title" style="font-size: 11.5px; color: #065F46; margin-bottom: 0;">
                EXISTING ADMIN PANEL
              </div>
              <span class="badge badge-green">Operational Console</span>
            </div>
            <div style="font-size: 8px; font-weight: 600; color: #047857; margin-bottom: 5px;">Preserved Working Environment (Next.js 16)</div>
            <ul class="feature-list" style="margin-top: 0; gap: 4px;">
              <li class="feature-item"><strong>Existing Admin Experience:</strong> Remains available for daily restaurant duties.</li>
              <li class="feature-item"><strong>Preserved Functionality:</strong> Current screens, layout, and UI workflows preserved.</li>
              <li class="feature-item"><strong>Controlled Feature Access:</strong> Access is controlled according to permissions assigned by Super Admin.</li>
              <li class="feature-item"><strong>Zero Disruption:</strong> Staff continue working in their familiar environment.</li>
              <li class="feature-item"><strong>No Orders-Only Redesign:</strong> Scope focuses strictly on governance, not restructuring.</li>
            </ul>
          </div>
        </div>
      </div>

    </div>

    <!-- Footer -->
    <div class="page-footer">
      <div class="footer-left">
        <span class="footer-dot"></span>
        <span>Tropical Gyros Proposal • TG-SAD-2026-V2</span>
      </div>
      <div class="footer-center">Confidential — For Internal Restaurant Management Review Only</div>
      <div class="footer-right">Page 6 of 7</div>
    </div>
  </div>

  <!-- =================================================================== -->
  <!-- PAGE 7: REPORTS, SETTINGS & FORMAL APPROVAL                         -->
  <!-- =================================================================== -->
  <div class="page" id="page-7">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <img src="{logo_data_uri}" alt="Logo" class="header-logo">
        <div class="header-title-block">
          <span class="header-title">Tropical Gyros Super Admin Proposal</span>
          <span class="header-subtitle">Modules 10 - 11 & Executive Sign-Off</span>
        </div>
      </div>
      <span class="header-badge">06 | Approval & Settings</span>
    </div>

    <!-- Body -->
    <div class="page-body">
      <div class="section-title-wrap">
        <div class="section-eyebrow">Governance & Sign-Off</div>
        <h2 class="section-heading">06. Reports, Settings & Formal Approval</h2>
        <p class="section-desc">
          Operational activity tracking, restaurant settings, and official management approval for Super Admin implementation.
        </p>
      </div>

      <!-- Modules 10 & 11 Grid -->
      <div class="grid-2" style="gap: 9px; margin-bottom: 10px;">
        <!-- Module 10 -->
        <div class="card" style="margin-bottom: 0; padding: 10px 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
            <div class="card-title" style="font-size: 11px; color: var(--deep-slate); margin-bottom: 0;">
              10. Reports & Activity Logs
            </div>
            <span class="badge badge-proposed" style="font-size: 7.5px;">Backend Required</span>
          </div>
          <p class="card-desc" style="font-size: 8.5px; margin-bottom: 5px;">
            Operational traceability recording administrative actions for accountability.
          </p>
          <ul class="feature-list" style="margin-top: 0;">
            <li class="feature-item"><strong>Business Reports:</strong> View sales summaries, order volumes, and payment methods in BSD.</li>
            <li class="feature-item"><strong>Operational Activity Logs:</strong> Monitor active order status changes and assignments.</li>
            <li class="feature-item"><strong>Admin Action Attribution:</strong> Identify which Admin performed a specific action.</li>
            <li class="feature-item"><strong>Activity Timestamps:</strong> Review date and time records of modifications.</li>
          </ul>
        </div>

        <!-- Module 11 -->
        <div class="card" style="margin-bottom: 0; padding: 10px 12px;">
          <div class="card-title" style="font-size: 11px; color: var(--deep-slate);">
            11. Restaurant Settings
          </div>
          <p class="card-desc" style="font-size: 8.5px; margin-bottom: 5px;">
            Restaurant-level operational configuration and system policy parameters.
          </p>
          <ul class="feature-list" style="margin-top: 0;">
            <li class="feature-item"><strong>Restaurant Information:</strong> Restaurant name, tagline, email, phone, and store address.</li>
            <li class="feature-item"><strong>Business Configuration:</strong> Tax rate, platform fees, and BSD currency formatting.</li>
            <li class="feature-item"><strong>Operating Settings:</strong> Store opening and closing hours.</li>
            <li class="feature-item"><strong>Delivery Configuration:</strong> Enforce strict 3.0-mile delivery radius policy.</li>
          </ul>
        </div>
      </div>

      <!-- FORMAL APPROVAL REQUEST (EXACT MANDATORY LANGUAGE) -->
      <div style="background: linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%); border: 1.5px solid #F5C842; border-radius: 9px; padding: 12px 14px; margin-bottom: 10px; box-shadow: 0 4px 12px rgba(245, 200, 66, 0.08);">
        <div style="display: flex; align-items: center; gap: 7px; margin-bottom: 5px;">
          <span style="font-size: 13px;">📋</span>
          <div style="font-size: 11px; font-weight: 700; color: #92400E; text-transform: uppercase; letter-spacing: 0.5px;">
            Approval Request
          </div>
        </div>

        <p style="font-size: 9.5px; color: #78350F; line-height: 1.5; font-style: italic; margin-bottom: 3px;">
          &ldquo;Please review the proposed Super Admin Panel scope and workflow.
        </p>
        <p style="font-size: 9.5px; color: #78350F; line-height: 1.5; font-style: italic; margin-bottom: 3px;">
          The existing Admin Panel will remain available, while the new Super Admin Panel will provide centralized control over restaurant operations, Admin account management and custom permission assignment.
        </p>
        <p style="font-size: 9.5px; color: #78350F; line-height: 1.5; font-style: italic;">
          Kindly review and confirm whether this proposed scope is approved or if any changes are required before implementation.&rdquo;
        </p>
      </div>

      <!-- FORMAL CLIENT APPROVAL & SIGN-OFF BLOCK -->
      <div style="background: #FFFFFF; border: 1.5px solid #CBD5E1; border-radius: 9px; padding: 12px 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid #E2E8F0; padding-bottom: 6px;">
          <div style="font-size: 10.5px; font-weight: 700; color: var(--deep-slate); text-transform: uppercase; letter-spacing: 0.5px;">
            Client Review & Scope Approval Area
          </div>
          <div style="display: flex; align-items: center; gap: 5px;">
            <span style="font-size: 8.5px; font-weight: 600; color: var(--muted-slate);">Approval Status:</span>
            <span class="badge badge-yellow" style="font-size: 8.5px; font-weight: 700;">Pending Review</span>
          </div>
        </div>

        <!-- Feedback & Sign-off Fields Following Section 6 -->
        <div style="display: flex; flex-direction: column; gap: 9px; font-size: 9px;">
          <div style="display: flex; align-items: flex-start; gap: 8px;">
            <span style="font-weight: 600; color: var(--charcoal); width: 110px; flex-shrink: 0;">Client Feedback:</span>
            <div style="flex: 1; border-bottom: 1px dashed #94A3B8; height: 15px;"></div>
          </div>

          <div style="display: flex; align-items: flex-start; gap: 8px;">
            <span style="font-weight: 600; color: var(--charcoal); width: 110px; flex-shrink: 0;">Approved By:</span>
            <div style="flex: 1; border-bottom: 1px dashed #94A3B8; height: 15px;"></div>
          </div>

          <div style="display: flex; align-items: flex-start; gap: 8px;">
            <span style="font-weight: 600; color: var(--charcoal); width: 110px; flex-shrink: 0;">Date:</span>
            <div style="flex: 1; border-bottom: 1px dashed #94A3B8; height: 15px;"></div>
          </div>
        </div>

        <div style="margin-top: 8px; font-size: 7.5px; color: var(--muted-slate); font-style: italic; text-align: center;">
          * Ready for management review and sign-off. Existing Admin Panel and mobile applications remain unmodified.
        </div>
      </div>

      <!-- Document Verification Stamp -->
      <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center; font-size: 7.5px; color: var(--muted-slate); border-top: 1px solid #E2E8F0; padding-top: 5px;">
        <span>Document ID: TG-SAD-2026-V2</span>
        <span>Tropical Gyros Restaurant Management Project</span>
        <span>Version 2.0 (Revised Project-Accurate Draft)</span>
      </div>

    </div>

    <!-- Footer -->
    <div class="page-footer">
      <div class="footer-left">
        <span class="footer-dot"></span>
        <span>Tropical Gyros Proposal • TG-SAD-2026-V2</span>
      </div>
      <div class="footer-center">Confidential — For Internal Restaurant Management Review Only</div>
      <div class="footer-right">Page 7 of 7</div>
    </div>
  </div>

</body>
</html>
"""

# Write HTML file
with open(HTML_OUT_PATH, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"HTML successfully written to: {HTML_OUT_PATH}")

# PDF Compilation Workflow
print("Compiling PDF using Google Chrome headless...")
chrome_path = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
if not os.path.exists(chrome_path):
    print(f"ERROR: Google Chrome binary not found at '{chrome_path}'")
    sys.exit(1)

file_url = f"file://{HTML_OUT_PATH}"
cmd = [
    chrome_path,
    "--headless",
    "--disable-gpu",
    "--no-pdf-header-footer",
    f"--print-to-pdf={PDF_OUT_PATH}",
    file_url
]

try:
    result = subprocess.run(cmd, capture_output=True, text=True, check=True)
    if os.path.exists(PDF_OUT_PATH) and os.path.getsize(PDF_OUT_PATH) > 0:
        pdf_size_kb = os.path.getsize(PDF_OUT_PATH) / 1024
        print(f"PDF successfully compiled at: {PDF_OUT_PATH} ({pdf_size_kb:.1f} KB)")
        
        # Verify page count
        with open(PDF_OUT_PATH, "rb") as pf:
            pdf_data = pf.read()
            counts = re.findall(rb'/Count\s+(\d+)', pdf_data)
            page_objs = re.findall(rb'/Type\s*/Page\b', pdf_data)
            print(f"Verified Page Count: /Count matches = {counts}, Direct /Type /Page = {len(page_objs)}")
    else:
        print("ERROR: PDF was not generated or has 0 bytes.")
        sys.exit(1)
except subprocess.CalledProcessError as e:
    print(f"ERROR running Chrome: {e.stderr}")
    sys.exit(1)
