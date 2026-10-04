"""Regression coverage for PromptForge bundles, Razorpay order flow, and admin APIs."""
import os
import uuid

import pytest
import requests


BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")


@pytest.fixture(scope="module")
def api():
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


def test_bundles_are_seeded_and_priced(api):
    response = api.get(f"{BASE_URL}/api/bundles", timeout=20)
    assert response.status_code == 200
    bundles = response.json()
    assert len(bundles) >= 3
    assert all(bundle["price"] == 299 for bundle in bundles)
    assert all("_id" not in bundle for bundle in bundles)


def test_unknown_bundle_order_is_rejected(api):
    response = api.post(
        f"{BASE_URL}/api/orders",
        json={"bundle_id": "does-not-exist", "customer_email": "qa@example.com"},
        timeout=20,
    )
    assert response.status_code == 404
    assert "Bundle not found" in response.json()["detail"]


def test_valid_order_creation_returns_razorpay_shape(api):
    bundles = api.get(f"{BASE_URL}/api/bundles", timeout=20).json()
    response = api.post(
        f"{BASE_URL}/api/orders",
        json={"bundle_id": bundles[0]["id"], "customer_email": "qa@example.com"},
        timeout=30,
    )
    assert response.status_code == 200
    data = response.json()
    assert data["amount"] == 29900
    assert data["currency"] == "INR"
    assert data["order_id"].startswith("order_")
    assert data["key_id"].startswith("rzp_test_")


def test_invalid_payment_signature_is_rejected(api):
    response = api.post(
        f"{BASE_URL}/api/payments/verify",
        json={
            "razorpay_order_id": "order_fake",
            "razorpay_payment_id": "pay_fake",
            "razorpay_signature": "invalid",
        },
        timeout=20,
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Payment verification failed"


def test_unpaid_download_is_rejected(api):
    response = api.get(
        f"{BASE_URL}/api/download/ultimate-ai",
        params={"order_id": "order_fake"},
        timeout=20,
    )
    assert response.status_code == 403
    assert "Complete payment" in response.json()["detail"]


def test_admin_requires_key(api):
    response = api.post(
        f"{BASE_URL}/api/admin/bundles",
        json={"title": "QA bundle", "description": "QA description", "tag": "QA"},
        timeout=20,
    )
    assert response.status_code == 401


def test_admin_can_create_bundle_and_it_is_listed(api):
    admin_key = os.environ["ADMIN_KEY"]
    title = f"TEST_{uuid.uuid4().hex[:8]} bundle"
    response = api.post(
        f"{BASE_URL}/api/admin/bundles",
        headers={"X-Admin-Key": admin_key},
        json={"title": title, "description": "Regression bundle", "tag": "TEST"},
        timeout=20,
    )
    assert response.status_code == 200
    created = response.json()
    assert created["title"] == title
    assert created["price"] == 299
    assert "_id" not in created
    bundles = api.get(f"{BASE_URL}/api/bundles", timeout=20).json()
    assert any(bundle["id"] == created["id"] for bundle in bundles)