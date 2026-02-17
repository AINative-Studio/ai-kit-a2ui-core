"""A2UI Python SDK - Framework-agnostic protocol implementation."""

__version__ = "0.1.0"

from a2ui.utils.json_pointer import JSONPointer, JSONPointerError

__all__ = [
    "__version__",
    # JSON Pointer
    "JSONPointer",
    "JSONPointerError",
]
