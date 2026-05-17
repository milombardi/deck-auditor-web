"""Shared sentinel for cooperative cancellation between API request and audit loop."""


class JobCancelled(Exception):
    """Raised from inside an audit loop when the caller flags the job to stop."""
