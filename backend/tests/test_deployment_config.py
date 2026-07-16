import json
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]


def test_backend_railway_start_command_uses_runtime_port() -> None:
    config = json.loads((REPO_ROOT / "backend" / "railway.json").read_text())
    start_command = config["deploy"]["startCommand"]

    assert "$PORT" in start_command
    assert "--port 8080" not in start_command


def test_docker_entrypoints_use_runtime_port() -> None:
    dockerfiles = [
        REPO_ROOT / "Dockerfile",
        REPO_ROOT / "backend" / "Dockerfile",
    ]

    for dockerfile in dockerfiles:
        content = dockerfile.read_text()
        assert "${PORT:-" in content
