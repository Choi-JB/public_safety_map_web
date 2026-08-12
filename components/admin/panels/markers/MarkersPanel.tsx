// 담당: 피드백/관리자팀

"use client";

import { useState } from "react";
import styles from "../../admin.module.css";
import { CityEventMarkerForm } from "./CityEventMarkerForm";
import { ReportMarkerForm } from "./ReportMarkerForm";

type MarkerFormTab = "report" | "city-event";

export function MarkersPanel() {
  const [tab, setTab] = useState<MarkerFormTab>("report");

  return (
    <div className={styles.panelRoot}>
      <div className={styles.panelHeader}>마커 등록</div>
      <div className={styles.markerTabs} role="tablist" aria-label="마커 등록 유형">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "report"}
          className={`${styles.markerTab} ${tab === "report" ? styles.markerTabActive : ""}`}
          onClick={() => setTab("report")}
        >
          제보
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "city-event"}
          className={`${styles.markerTab} ${tab === "city-event" ? styles.markerTabActive : ""}`}
          onClick={() => setTab("city-event")}
        >
          도시정보
        </button>
      </div>
      <div className={styles.panelBodyScroll}>
        {tab === "report" ? <ReportMarkerForm /> : <CityEventMarkerForm />}
      </div>
    </div>
  );
}
