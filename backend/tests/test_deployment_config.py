import json
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]


def test_backend_railway_start_command_uses_runtime_port() -> None:
    config = json.loads((REPO_ROOT / "backend" / "railway.json").read_text())
    start_command = config["deploy"]["startCommand"]

    assert start_command.startswith("sh -c ")
    assert "${PORT:-8080}" in start_command
    assert "--port 8080" not in start_command


def test_docker_entrypoints_use_runtime_port() -> None:
    dockerfiles = [
        REPO_ROOT / "Dockerfile",
        REPO_ROOT / "backend" / "Dockerfile",
    ]

    for dockerfile in dockerfiles:
        content = dockerfile.read_text()
        assert "${PORT:-" in content


def test_docker_contexts_exclude_local_env_files() -> None:
    root_dockerignore = (REPO_ROOT / ".dockerignore").read_text().splitlines()
    backend_dockerignore = (REPO_ROOT / "backend" / ".dockerignore").read_text().splitlines()

    for required_pattern in [".env", ".env*", ".env.local", ".env.*.local"]:
        assert required_pattern in root_dockerignore
        assert required_pattern in backend_dockerignore

    for required_pattern in ["**/.env", "**/.env*", "**/.env.local", "**/.env.*.local"]:
        assert required_pattern in root_dockerignore
