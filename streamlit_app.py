import os
import streamlit as st
import streamlit.components.v1 as components

# 1. Page Configuration: Wide layout, dark sports telemetry theme
st.set_page_config(
    page_title="KINETIC // OS — Biometrics, Training & Nutrition Intelligence",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# 2. Aggressive CSS injection to strip Streamlit chrome (Header, Footer, Margins, Top Bar)
st.markdown(
    """
    <style>
        /* Hide Streamlit default header, footer and main menu */
        header { visibility: hidden !important; height: 0 !important; }
        #MainMenu { visibility: hidden !important; }
        footer { visibility: hidden !important; height: 0 !important; }
        div[data-testid="stDecoration"] { display: none !important; }
        div[data-testid="stToolbar"] { display: none !important; }

        /* Remove default Streamlit page margins and padding */
        .main .block-container {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
        }
        
        /* Force dark canvas */
        html, body, [data-testid="stAppViewContainer"], [data-testid="stApp"] {
            background-color: #09090B !important;
            color: #FAFAFA !important;
            overflow: hidden !important;
        }
        
        iframe {
            border: none !important;
            width: 100% !important;
            display: block !important;
        }
    </style>
    """,
    unsafe_allow_html=True,
)

# 3. Locate compiled singlefile dist/index.html
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
dist_index_path = os.path.join(BASE_DIR, "dist", "index.html")

if not os.path.exists(dist_index_path):
    alt_path = os.path.join(BASE_DIR, "kinetic-os", "dist", "index.html")
    if os.path.exists(alt_path):
        dist_index_path = alt_path

if os.path.exists(dist_index_path):
    with open(dist_index_path, "r", encoding="utf-8") as f:
        html_content = f.read()
    components.html(html_content, height=1000, scrolling=True)
else:
    st.error(
        "KINETIC // OS production bundle not found. Please run `npm run build` inside `kinetic-os` to generate `dist/index.html`."
    )
