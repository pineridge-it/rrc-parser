from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import logging
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)


@dataclass
class IngestionMetrics:
    """Data class for ingestion metrics."""
    last_successful_run: Optional[datetime] = None
    last_run_duration: Optional[float] = None
    records_processed: Optional[int] = None
    error_count: int = 0
    lag_minutes: Optional[float] = None
    total_records: Optional[int] = None
    failed_records: Optional[int] = None


@dataclass
class SLOStatus:
    """Data class for SLO status."""
    metric: str
    current_value: float
    threshold: float
    status: str  # 'healthy', 'warning', 'critical'
    message: str


class AlertSeverity(Enum):
    """Alert severity levels."""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class IngestionMonitor:
    """Monitor for ingestion pipeline metrics and SLOs."""
    
    def __init__(self):
        self.metrics_store = {}  # In-memory store for demo purposes
        self.alert_manager = None
    
    def set_alert_manager(self, alert_manager):
        """Set the alert manager for sending alerts."""
        self.alert_manager = alert_manager
    
    def record_run_start(self, run_id: str) -> None:
        """Record the start of an ingestion run."""
        self.metrics_store[run_id] = {
            'start_time': datetime.now(),
            'status': 'running'
        }
        logger.info(f"Started monitoring run {run_id}")
    
    def record_run_complete(self, run_id: str, metrics: Dict[str, Any]) -> None:
        """Record the completion of an ingestion run."""
        if run_id in self.metrics_store:
            self.metrics_store[run_id].update({
                'end_time': datetime.now(),
                'status': 'completed',
                'metrics': metrics
            })
            
            # Calculate duration
            start_time = self.metrics_store[run_id]['start_time']
            duration = (datetime.now() - start_time).total_seconds()
            self.metrics_store[run_id]['duration'] = duration
            
            logger.info(f"Completed monitoring run {run_id} in {duration:.2f}s")
            
            # Check SLOs and send alerts if needed
            self._check_slos_and_alert(metrics, duration)
    
    def record_run_error(self, run_id: str, error: Exception) -> None:
        """Record an error in an ingestion run."""
        if run_id in self.metrics_store:
            self.metrics_store[run_id].update({
                'end_time': datetime.now(),
                'status': 'failed',
                'error': str(error)
            })
            
            # Calculate duration
            start_time = self.metrics_store[run_id]['start_time']
            duration = (datetime.now() - start_time).total_seconds()
            self.metrics_store[run_id]['duration'] = duration
            
            logger.error(f"Failed monitoring run {run_id} after {duration:.2f}s: {error}")
            
            # Send critical alert for pipeline failure
            if self.alert_manager:
                self.alert_manager.send_alert(
                    "Pipeline Failure",
                    f"Ingestion pipeline {run_id} failed after {duration:.2f}s: {error}",
                    AlertSeverity.CRITICAL.value
                )
    
    def _check_slos_and_alert(self, metrics: Dict[str, Any], duration: float) -> None:
        """Check SLOs and send alerts if thresholds are exceeded."""
        if not self.alert_manager:
            return
        
        # Check for critical alerts
        if metrics.get('success', False) is False:
            self.alert_manager.send_alert(
                "Pipeline Failure",
                f"Ingestion pipeline failed: {metrics.get('error', 'Unknown error')}",
                AlertSeverity.CRITICAL.value
            )
            return
        
        # Check error rate
        error_rate = metrics.get('error_count', 0) / max(metrics.get('records_processed', 1), 1)
        if error_rate > 0.1:  # 10% error rate
            self.alert_manager.send_alert(
                "High Error Rate",
                f"Pipeline error rate is {error_rate:.2%} (threshold: 10%)",
                AlertSeverity.CRITICAL.value
            )
        elif error_rate > 0.05:  # 5% error rate
            self.alert_manager.send_alert(
                "Moderate Error Rate",
                f"Pipeline error rate is {error_rate:.2%} (threshold: 5%)",
                AlertSeverity.WARNING.value
            )
        
        # Check pipeline duration
        if duration > 7200:  # 2 hours
            self.alert_manager.send_alert(
                "Pipeline Timeout",
                f"Pipeline took {duration/3600:.2f} hours to complete (threshold: 2 hours)",
                AlertSeverity.CRITICAL.value
            )
        elif duration > 3600:  # 1 hour
            self.alert_manager.send_alert(
                "Slow Pipeline",
                f"Pipeline took {duration/60:.2f} minutes to complete (threshold: 60 minutes)",
                AlertSeverity.WARNING.value
            )
        
        # Check data freshness
        lag_minutes = metrics.get('lag_minutes', 0)
        if lag_minutes > 120:  # 2 hours
            self.alert_manager.send_alert(
                "Data Stale",
                f"Data is {lag_minutes:.1f} minutes behind RRC (threshold: 120 minutes)",
                AlertSeverity.CRITICAL.value
            )
        elif lag_minutes > 60:  # 1 hour
            self.alert_manager.send_alert(
                "Data Lagging",
                f"Data is {lag_minutes:.1f} minutes behind RRC (threshold: 60 minutes)",
                AlertSeverity.WARNING.value
            )
    
    def get_current_metrics(self) -> IngestionMetrics:
        """Get current ingestion metrics."""
        # Find the most recent completed run
        completed_runs = [
            run for run_id, run in self.metrics_store.items()
            if run.get('status') == 'completed'
        ]
        
        if not completed_runs:
            return IngestionMetrics()
        
        # Sort by end time to get the most recent
        completed_runs.sort(key=lambda x: x['end_time'], reverse=True)
        latest_run = completed_runs[0]
        
        metrics = latest_run.get('metrics', {})
        
        return IngestionMetrics(
            last_successful_run=latest_run['end_time'],
            last_run_duration=latest_run.get('duration'),
            records_processed=metrics.get('records_processed'),
            error_count=metrics.get('error_count', 0),
            lag_minutes=metrics.get('lag_minutes'),
            total_records=metrics.get('total_records'),
            failed_records=metrics.get('failed_records')
        )
    
    def check_slos(self) -> List[SLOStatus]:
        """Check all SLOs and return their status."""
        metrics = self.get_current_metrics()
        slo_statuses = []
        
        # Check data freshness SLO (95% < 2 hours)
        if metrics.lag_minutes is not None:
            status = 'healthy'
            if metrics.lag_minutes > 120:  # 2 hours
                status = 'critical'
            elif metrics.lag_minutes > 60:  # 1 hour
                status = 'warning'
            
            slo_statuses.append(SLOStatus(
                metric="data_freshness",
                current_value=metrics.lag_minutes,
                threshold=120.0,
                status=status,
                message=f"Data freshness: {metrics.lag_minutes:.1f} minutes behind RRC"
            ))
        
        # Check pipeline success rate SLO
        # This would require more historical data in a real implementation
        
        return slo_statuses