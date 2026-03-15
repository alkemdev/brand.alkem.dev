//! Generative 3D flask: first-principles surface of revolution.
//! Torus base → straight cone → constant neck → lip bump.
//! Contains the profile/mesh math, OBJ export, and the Dioxus UI component.

use std::f64::consts::PI;

use dioxus::events::MouseData;
use dioxus::prelude::*;
use serde::Serialize;

// ── Parameters ──────────────────────────────────────────────────────────────

#[derive(Clone, Debug, PartialEq)]
pub struct FlaskParams {
    pub base_height: f64,
    pub base_radius: f64,
    pub body_height: f64,
    pub neck_radius: f64,
    pub neck_height: f64,
    pub lip_height: f64,
    pub lip_bump: f64,
}

impl Default for FlaskParams {
    fn default() -> Self {
        DEFAULT_FLASK_PARAMS.clone()
    }
}

pub const DEFAULT_FLASK_PARAMS: FlaskParams = FlaskParams {
    base_height: 0.05,
    base_radius: 0.2,
    body_height: 0.45,
    neck_radius: 0.08,
    neck_height: 0.2,
    lip_height: 0.03,
    lip_bump: 0.015,
};

impl FlaskParams {
    pub fn total_height(&self) -> f64 {
        self.base_height + self.body_height + self.neck_height + self.lip_height
    }
}

// ── Profile types ────────────────────────────────────────────────────────────

#[derive(Clone, Copy, Debug)]
pub struct ControlPoint {
    pub y: f64,
    pub r: f64,
}

#[derive(Clone, Copy, Debug)]
pub struct ProfilePoint {
    pub y: f64,
    pub r: f64,
}

#[derive(Clone, Debug)]
pub struct Profile {
    pub points: Vec<ProfilePoint>,
    pub y_max: f64,
    pub r_max: f64,
}

// ── Mesh ─────────────────────────────────────────────────────────────────────

#[derive(Clone, Debug)]
pub struct RevolutionMesh {
    pub positions: Vec<f32>,
    pub normals: Vec<f32>,
    pub indices: Vec<u32>,
}

// ── Torus base ───────────────────────────────────────────────────────────────
// Center (R, 0) in (y,r), radius R, through (0,0) and (base_height, base_radius).
// R = (base_radius² + base_height²) / (2 * base_height).

fn torus_base_radius(y: f64, base_height: f64, base_radius: f64) -> f64 {
    if base_height <= 0.0 || base_radius <= 0.0 {
        return if y <= 0.0 { 0.0 } else { base_radius };
    }
    let r = (base_radius * base_radius + base_height * base_height) / (2.0 * base_height);
    let d = y - r;
    let r2 = r * r - d * d;
    if r2 <= 0.0 {
        0.0
    } else {
        r2.sqrt()
    }
}

fn torus_base_slope(y: f64, base_height: f64, base_radius: f64) -> f64 {
    if base_height <= 0.0 || base_radius <= 0.0 {
        return 0.0;
    }
    let r = (base_radius * base_radius + base_height * base_height) / (2.0 * base_height);
    let d = y - r;
    let r2 = r * r - d * d;
    if r2 <= 0.0 {
        0.0
    } else {
        -d / r2.sqrt()
    }
}

// ── Hermite interpolation ─────────────────────────────────────────────────────

fn hermite(t: f64, r0: f64, m0: f64, r1: f64, m1: f64) -> f64 {
    let t2 = t * t;
    let t3 = t2 * t;
    let h00 = 2.0 * t3 - 3.0 * t2 + 1.0;
    let h10 = t3 - 2.0 * t2 + t;
    let h01 = -2.0 * t3 + 3.0 * t2;
    let h11 = t3 - t2;
    h00 * r0 + h10 * m0 + h01 * r1 + h11 * m1
}

// ── Profile building ─────────────────────────────────────────────────────────

fn control_points_from_params(p: &FlaskParams) -> Vec<ControlPoint> {
    let y_base = p.base_height;
    let y_cone_end = y_base + p.body_height;
    let y_neck_end = y_cone_end + p.neck_height;
    let h = p.total_height();

    let mut pts: Vec<ControlPoint> = (0..=4)
        .map(|i| {
            let y = (i as f64 / 4.0) * y_base;
            ControlPoint {
                y,
                r: torus_base_radius(y, p.base_height, p.base_radius),
            }
        })
        .collect();

    pts.push(ControlPoint {
        y: y_cone_end,
        r: p.neck_radius,
    });
    pts.push(ControlPoint {
        y: y_neck_end,
        r: p.neck_radius,
    });
    pts.push(ControlPoint {
        y: y_neck_end + p.lip_height * 0.4,
        r: p.neck_radius + p.lip_bump,
    });
    pts.push(ControlPoint {
        y: h,
        r: p.neck_radius,
    });
    pts
}

fn slopes(points: &[ControlPoint], base_height: f64, base_radius: f64) -> Vec<f64> {
    let n = points.len();
    let use_torus = n >= 5
        && base_height > 0.0
        && base_radius > 0.0
        && points[0].y == 0.0
        && points[0].r == 0.0;

    (0..n)
        .map(|i| {
            let pt = &points[i];
            if use_torus && pt.y <= base_height {
                return torus_base_slope(pt.y, base_height, base_radius);
            }
            if n == 1 {
                return 0.0;
            }
            if i == 0 {
                let dy = points[1].y - points[0].y;
                if dy != 0.0 {
                    (points[1].r - points[0].r) / dy
                } else {
                    0.0
                }
            } else if i == n - 1 {
                let dy = points[n - 1].y - points[n - 2].y;
                if dy != 0.0 {
                    (points[n - 1].r - points[n - 2].r) / dy
                } else {
                    0.0
                }
            } else {
                let dy = points[i + 1].y - points[i - 1].y;
                if dy != 0.0 {
                    (points[i + 1].r - points[i - 1].r) / dy
                } else {
                    0.0
                }
            }
        })
        .collect()
}

fn radius_at_y(
    y: f64,
    points: &[ControlPoint],
    slopes_arr: &[f64],
    h: f64,
    base_height: f64,
    base_radius: f64,
) -> f64 {
    if y <= 0.0 {
        return 0.0;
    }
    if y >= h {
        return points.last().map(|p| p.r).unwrap_or(0.0);
    }
    if base_height > 0.0 && base_radius > 0.0 && y <= base_height {
        return torus_base_radius(y, base_height, base_radius).max(0.0);
    }
    for i in 0..points.len().saturating_sub(1) {
        let p0 = points[i];
        let p1 = points[i + 1];
        if y >= p0.y && y <= p1.y {
            let dy = p1.y - p0.y;
            if dy <= 0.0 {
                return p0.r.max(0.0);
            }
            let t = (y - p0.y) / dy;
            let m0 = slopes_arr[i] * dy;
            let m1 = slopes_arr[i + 1] * dy;
            return hermite(t, p0.r, m0, p1.r, m1).max(0.0);
        }
    }
    points.last().map(|p| p.r).unwrap_or(0.0).max(0.0)
}

pub fn get_profile(p: &FlaskParams, vertical_segments: usize) -> Profile {
    let points = control_points_from_params(p);
    let h = p.total_height();
    let slopes_arr = slopes(&points, p.base_height, p.base_radius);
    let eps = h * 0.001;
    let mut out = Vec::with_capacity(vertical_segments + 2);
    for i in 0..=vertical_segments {
        let y = if i == 0 {
            eps
        } else {
            (i as f64 / vertical_segments as f64) * h
        };
        let r = radius_at_y(y, &points, &slopes_arr, h, p.base_height, p.base_radius);
        out.push(ProfilePoint { y, r });
    }
    let r_max = points.iter().map(|pt| pt.r).fold(0.0_f64, f64::max);
    Profile {
        y_max: h,
        r_max,
        points: out,
    }
}

// ── Mesh ─────────────────────────────────────────────────────────────────────

pub fn build_revolution_mesh(profile: &Profile, azimuth_segments: usize) -> RevolutionMesh {
    let n_rings = profile.points.len();
    let ring_verts = n_rings * (azimuth_segments + 1);
    let n_verts = ring_verts + 1; // +1 for bottom cap

    let mut positions = vec![0.0_f32; n_verts * 3];
    let mut normals = vec![0.0_f32; n_verts * 3];

    for (i, pt) in profile.points.iter().enumerate() {
        let dr = if i == 0 {
            let dy = profile.points[1].y - profile.points[0].y;
            if dy != 0.0 {
                (profile.points[1].r - profile.points[0].r) / dy
            } else {
                0.0
            }
        } else if i == n_rings - 1 {
            let dy = profile.points[n_rings - 1].y - profile.points[n_rings - 2].y;
            if dy != 0.0 {
                (profile.points[n_rings - 1].r - profile.points[n_rings - 2].r) / dy
            } else {
                0.0
            }
        } else {
            let dy = profile.points[i + 1].y - profile.points[i - 1].y;
            if dy != 0.0 {
                (profile.points[i + 1].r - profile.points[i - 1].r) / dy
            } else {
                0.0
            }
        };
        let len = (dr * dr + 1.0_f64).sqrt().max(1e-10);
        let nr = (1.0 / len) as f32;
        let ny = (-dr / len) as f32;

        for j in 0..=azimuth_segments {
            let theta = (j as f64 / azimuth_segments as f64) * PI * 2.0;
            let c = theta.cos() as f32;
            let s = theta.sin() as f32;
            let idx = (i * (azimuth_segments + 1) + j) * 3;
            positions[idx] = (pt.r as f32) * c;
            positions[idx + 1] = pt.y as f32;
            positions[idx + 2] = (pt.r as f32) * s;
            normals[idx] = nr * c;
            normals[idx + 1] = ny;
            normals[idx + 2] = nr * s;
        }
    }

    let bottom = ring_verts;
    normals[bottom * 3 + 1] = -1.0;

    let mut indices =
        Vec::with_capacity((n_rings - 1) * azimuth_segments * 6 + azimuth_segments * 3);
    for i in 0..n_rings - 1 {
        for j in 0..azimuth_segments {
            let a = i * (azimuth_segments + 1) + j;
            let b = a + 1;
            let c = a + (azimuth_segments + 1);
            let d = c + 1;
            indices.extend([a as u32, c as u32, b as u32, b as u32, c as u32, d as u32]);
        }
    }
    for j in 0..azimuth_segments {
        indices.extend([bottom as u32, j as u32, (j + 1) as u32]);
    }

    RevolutionMesh {
        positions,
        normals,
        indices,
    }
}

/// Full pipeline: profile + mesh from params.
pub fn build_flask(
    p: &FlaskParams,
    vertical_segments: usize,
    azimuth_segments: usize,
) -> (Profile, RevolutionMesh) {
    let profile = get_profile(p, vertical_segments);
    let mesh = build_revolution_mesh(&profile, azimuth_segments);
    (profile, mesh)
}

/// Export mesh to Wavefront OBJ.
pub fn mesh_to_obj(mesh: &RevolutionMesh) -> String {
    let mut lines = vec![
        "# Alkemical Development — Generative 3D Flask".to_string(),
        "# First-principles surface of revolution".to_string(),
        String::new(),
    ];
    for i in (0..mesh.positions.len()).step_by(3) {
        lines.push(format!(
            "v {} {} {}",
            mesh.positions[i],
            mesh.positions[i + 1],
            mesh.positions[i + 2]
        ));
    }
    lines.push(String::new());
    for i in (0..mesh.normals.len()).step_by(3) {
        lines.push(format!(
            "vn {} {} {}",
            mesh.normals[i],
            mesh.normals[i + 1],
            mesh.normals[i + 2]
        ));
    }
    lines.push(String::new());
    for i in (0..mesh.indices.len()).step_by(3) {
        let (a, b, c) = (
            mesh.indices[i] + 1,
            mesh.indices[i + 1] + 1,
            mesh.indices[i + 2] + 1,
        );
        lines.push(format!("f {}//{} {}//{} {}//{}", a, a, b, b, c, c));
    }
    lines.join("\n")
}

// ── Dioxus UI ─────────────────────────────────────────────────────────────────

#[derive(Clone, Serialize)]
struct MeshData {
    positions: Vec<f32>,
    normals: Vec<f32>,
    indices: Vec<u32>,
}

/// Flask generator UI: sliders, 3D canvas, Reset, Download OBJ.
/// Set `show_back_button: true` and pass `on_navigate_back` to show a "← Back" button.
#[component]
pub fn Flask3d(show_back_button: bool, on_navigate_back: EventHandler<()>) -> Element {
    let mut params = use_signal(|| DEFAULT_FLASK_PARAMS.clone());
    let p = params();
    let (_profile, mesh) = build_flask(&p, 48, 32);
    let obj = mesh_to_obj(&mesh);
    let mesh_json = serde_json::to_string(&MeshData {
        positions: mesh.positions.clone(),
        normals: mesh.normals.clone(),
        indices: mesh.indices.clone(),
    })
    .unwrap_or_default();

    rsx! {
        div { class: "page flask-page",
            if show_back_button {
                button { onclick: move |_| on_navigate_back.call(()), "← Back" }
            }
            h1 { "3D Generative Flask" }
            p { class: "lead",
                "Torus base → straight cone → constant neck → lip bump. Surface of revolution."
            }
            div { class: "layout",
                div { class: "canvas-wrap",
                    canvas {
                        id: "flask-3d-canvas",
                        "data-mesh": "{mesh_json}",
                        width: "600",
                        height: "400",
                    }
                }
                aside { class: "controls",
                    h2 { "Profile parameters" }
                    Slider { label: "Base height", value: params().base_height, min: 0.02, max: 0.12, step: 0.005,
                        onchange: move |v| params.write().base_height = v
                    }
                    Slider { label: "Base radius", value: params().base_radius, min: 0.05, max: 0.4, step: 0.01,
                        onchange: move |v| params.write().base_radius = v
                    }
                    Slider { label: "Cone height", value: params().body_height, min: 0.2, max: 0.7, step: 0.01,
                        onchange: move |v| params.write().body_height = v
                    }
                    Slider { label: "Neck radius", value: params().neck_radius, min: 0.02, max: 0.2, step: 0.01,
                        onchange: move |v| params.write().neck_radius = v
                    }
                    Slider { label: "Neck height", value: params().neck_height, min: 0.08, max: 0.5, step: 0.01,
                        onchange: move |v| params.write().neck_height = v
                    }
                    Slider { label: "Lip height", value: params().lip_height, min: 0.01, max: 0.08, step: 0.005,
                        onchange: move |v| params.write().lip_height = v
                    }
                    Slider { label: "Lip bump", value: params().lip_bump, min: 0.0, max: 0.04, step: 0.005,
                        onchange: move |v| params.write().lip_bump = v
                    }
                    button {
                        onclick: move |_| params.set(DEFAULT_FLASK_PARAMS.clone()),
                        "Reset"
                    }
                    a {
                        href: "#",
                        onclick: move |ev: Event<MouseData>| {
                            ev.prevent_default();
                            download_obj(&obj);
                        },
                        "Download OBJ"
                    }
                }
            }
        }
    }
}

#[component]
fn Slider(
    label: &'static str,
    value: f64,
    min: f64,
    max: f64,
    step: f64,
    onchange: EventHandler<f64>,
) -> Element {
    let val_str = format!("{:.3}", value);
    rsx! {
        div { class: "control-row",
            label { "{label}" }
            span { class: "value", "{val_str}" }
            input {
                r#type: "range",
                min: "{min}",
                max: "{max}",
                step: "{step}",
                value: "{value}",
                oninput: move |ev| {
                    if let Ok(s) = ev.value().parse::<f64>() {
                        onchange.call(s);
                    }
                }
            }
        }
    }
}

fn download_obj(obj: &str) {
    let _ = obj;
}
