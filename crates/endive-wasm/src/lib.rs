//! WebAssembly interface to Endive.

use endive_kernel::{univ_lvl, Binding, Ix, Tm};
use js_sys::{Array, Error, Object, Reflect, TypeError};
use wasm_bindgen::prelude::*;

fn js_univ_lvl_to_kernel_univ_lvl(value: &JsValue) -> Result<univ_lvl::Expr, JsValue> {
    let value = value
        .dyn_ref()
        .ok_or_else(|| TypeError::new("Universe level must be an object"))?;
    let entries = Object::entries(value);
    let mut expr = univ_lvl::Expr::default();
    for entry in entries.iter() {
        let entry: &Array = entry.unchecked_ref();
        let var = univ_lvl::Var(
            entry
                .get(0)
                .as_f64()
                .ok_or_else(|| TypeError::new("Universe level variable must be a number"))?
                as usize,
        );
        let c = entry
            .get(1)
            .as_f64()
            .ok_or_else(|| TypeError::new("Universe level constant must be a number"))?
            as u32;
        expr = expr.max(&(univ_lvl::Expr::from(var) + c));
    }
    Ok(expr)
}

fn kernel_univ_lvl_to_js_univ_lvl(expr: &univ_lvl::Expr) -> JsValue {
    let obj = Object::new();
    for (var, c) in expr.iter() {
        Reflect::set(
            &obj,
            &JsValue::from_f64(var.0 as f64),
            &JsValue::from_f64(c as f64),
        )
        .unwrap();
    }
    obj.into()
}

fn js_tm_to_kernel_tm(value: &JsValue) -> Result<Tm, JsValue> {
    let tag = Reflect::get(value, &JsValue::from_str("type"))?
        .as_string()
        .ok_or_else(|| TypeError::new("Term must have a string type"))?;
    match tag.as_str() {
        "variable" => {
            let ix = Reflect::get(&value, &JsValue::from_str("index"))?
                .as_f64()
                .ok_or_else(|| TypeError::new("Variable index must be a number"))?;
            Ok(Tm::Var(Ix(ix as usize)))
        }
        "abstraction" => {
            let bound_ty =
                js_tm_to_kernel_tm(&Reflect::get(value, &JsValue::from_str("variable"))?)?;
            let body = js_tm_to_kernel_tm(&Reflect::get(value, &JsValue::from_str("body"))?)?;
            Ok(Tm::Abs(Box::new(Binding { bound_ty, body })))
        }
        "application" => {
            let n = js_tm_to_kernel_tm(&Reflect::get(&value, &JsValue::from_str("f"))?)?;
            let m = js_tm_to_kernel_tm(&Reflect::get(&value, &JsValue::from_str("argument"))?)?;
            Ok(Tm::App(Box::new(n), Box::new(m)))
        }
        "pi" => {
            let bound_ty =
                js_tm_to_kernel_tm(&Reflect::get(&value, &JsValue::from_str("variable"))?)?;
            let body = js_tm_to_kernel_tm(&Reflect::get(&value, &JsValue::from_str("body"))?)?;
            Ok(Tm::Pi(Box::new(Binding { bound_ty, body })))
        }
        "universe" => {
            let level = js_univ_lvl_to_kernel_univ_lvl(&Reflect::get(
                &value,
                &JsValue::from_str("level"),
            )?)?;
            Ok(Tm::U(level))
        }
        "fixpoint" => {
            let ty = js_tm_to_kernel_tm(&Reflect::get(&value, &JsValue::from_str("target"))?)?;
            let ctors = Reflect::get(&value, &JsValue::from_str("constructors"))?
                .dyn_ref::<Array>()
                .ok_or_else(|| TypeError::new("Fixpoint constructors must be an array"))?
                .iter()
                .map(|ctor| js_tm_to_kernel_tm(&ctor))
                .collect::<Result<Vec<_>, _>>()?;
            Ok(Tm::Fix {
                ty: Box::new(ty),
                ctors,
            })
        }
        "constructor" => {
            let fix = js_tm_to_kernel_tm(&Reflect::get(&value, &JsValue::from_str("fixpoint"))?)?;
            let i = Reflect::get(&value, &JsValue::from_str("index"))?
                .as_f64()
                .ok_or_else(|| TypeError::new("Constructor index must be a number"))?
                as usize;
            let args = Reflect::get(&value, &JsValue::from_str("arguments"))?
                .dyn_ref::<Array>()
                .ok_or_else(|| TypeError::new("Constructor arguments must be an array"))?
                .iter()
                .map(|ctor| js_tm_to_kernel_tm(&ctor))
                .collect::<Result<Vec<_>, _>>()?;
            Ok(Tm::Ctor {
                fix: Box::new(fix),
                i,
                args,
            })
        }
        "induction" => {
            let val = js_tm_to_kernel_tm(&Reflect::get(&value, &JsValue::from_str("value"))?)?;
            let motive = js_tm_to_kernel_tm(&Reflect::get(&value, &JsValue::from_str("motive"))?)?;
            let cases = Reflect::get(&value, &JsValue::from_str("cases"))?
                .dyn_ref::<Array>()
                .ok_or_else(|| TypeError::new("Induction cases must be an array"))?
                .iter()
                .map(|ctor| js_tm_to_kernel_tm(&ctor))
                .collect::<Result<Vec<_>, _>>()?;
            Ok(Tm::Ind {
                val: Box::new(val),
                motive: Box::new(motive),
                cases,
            })
        }
        _ => Err(TypeError::new("Unknown term type").into()),
    }
}

fn kernel_tm_to_js_tm(tm: &Tm) -> JsValue {
    match tm {
        Tm::Var(Ix(ix)) => {
            let obj = Object::new();
            Reflect::set(
                &obj,
                &JsValue::from_str("type"),
                &JsValue::from_str("variable"),
            )
            .unwrap();
            Reflect::set(
                &obj,
                &JsValue::from_str("index"),
                &JsValue::from_f64(*ix as f64),
            )
            .unwrap();
            obj.into()
        }
        Tm::Abs(binding) => {
            let obj = Object::new();
            Reflect::set(
                &obj,
                &JsValue::from_str("type"),
                &JsValue::from_str("abstraction"),
            )
            .unwrap();
            Reflect::set(
                &obj,
                &JsValue::from_str("variable"),
                &kernel_tm_to_js_tm(&binding.bound_ty),
            )
            .unwrap();
            Reflect::set(
                &obj,
                &JsValue::from_str("body"),
                &kernel_tm_to_js_tm(&binding.body),
            )
            .unwrap();
            obj.into()
        }
        Tm::App(n, m) => {
            let obj = Object::new();
            Reflect::set(
                &obj,
                &JsValue::from_str("type"),
                &JsValue::from_str("application"),
            )
            .unwrap();
            Reflect::set(&obj, &JsValue::from_str("f"), &kernel_tm_to_js_tm(n)).unwrap();
            Reflect::set(&obj, &JsValue::from_str("argument"), &kernel_tm_to_js_tm(m)).unwrap();
            obj.into()
        }
        Tm::Pi(binding) => {
            let obj = Object::new();
            Reflect::set(&obj, &JsValue::from_str("type"), &JsValue::from_str("pi")).unwrap();
            Reflect::set(
                &obj,
                &JsValue::from_str("variable"),
                &kernel_tm_to_js_tm(&binding.bound_ty),
            )
            .unwrap();
            Reflect::set(
                &obj,
                &JsValue::from_str("body"),
                &kernel_tm_to_js_tm(&binding.body),
            )
            .unwrap();
            obj.into()
        }
        Tm::U(level) => {
            let obj = Object::new();
            Reflect::set(
                &obj,
                &JsValue::from_str("type"),
                &JsValue::from_str("universe"),
            )
            .unwrap();
            Reflect::set(
                &obj,
                &JsValue::from_str("level"),
                &kernel_univ_lvl_to_js_univ_lvl(level),
            )
            .unwrap();
            obj.into()
        }
        Tm::Fix { ty, ctors } => {
            let obj = Object::new();
            Reflect::set(
                &obj,
                &JsValue::from_str("type"),
                &JsValue::from_str("fixpoint"),
            )
            .unwrap();
            Reflect::set(&obj, &JsValue::from_str("target"), &kernel_tm_to_js_tm(ty)).unwrap();
            let ctors = ctors
                .iter()
                .map(|ctor| kernel_tm_to_js_tm(ctor))
                .collect::<Array>();
            Reflect::set(&obj, &JsValue::from_str("constructors"), &ctors).unwrap();
            obj.into()
        }
        Tm::Ctor { fix, i, args } => {
            let obj = Object::new();
            Reflect::set(
                &obj,
                &JsValue::from_str("type"),
                &JsValue::from_str("constructor"),
            )
            .unwrap();
            Reflect::set(
                &obj,
                &JsValue::from_str("fixpoint"),
                &kernel_tm_to_js_tm(fix),
            )
            .unwrap();
            Reflect::set(
                &obj,
                &JsValue::from_str("index"),
                &JsValue::from_f64(*i as f64),
            )
            .unwrap();
            let args = args
                .iter()
                .map(|arg| kernel_tm_to_js_tm(arg))
                .collect::<Array>();
            Reflect::set(&obj, &JsValue::from_str("arguments"), &args).unwrap();
            obj.into()
        }
        Tm::Ind { val, motive, cases } => {
            let obj = Object::new();
            Reflect::set(
                &obj,
                &JsValue::from_str("type"),
                &JsValue::from_str("induction"),
            )
            .unwrap();
            Reflect::set(&obj, &JsValue::from_str("value"), &kernel_tm_to_js_tm(val)).unwrap();
            Reflect::set(
                &obj,
                &JsValue::from_str("motive"),
                &kernel_tm_to_js_tm(motive),
            )
            .unwrap();
            let cases = cases
                .iter()
                .map(|case| kernel_tm_to_js_tm(case))
                .collect::<Array>();
            Reflect::set(&obj, &JsValue::from_str("cases"), &cases).unwrap();
            obj.into()
        }
    }
}

fn kernel_error_to_js_error(err: endive_kernel::Error) -> JsValue {
    match err {
        endive_kernel::Error::IxOverflow => Error::new("Index overflow").into(),
        endive_kernel::Error::TyMismatch => Error::new("Type mismatch").into(),
    }
}

#[wasm_bindgen]
pub fn normalize(n: &JsValue) -> Result<JsValue, JsValue> {
    Ok(kernel_tm_to_js_tm(
        &js_tm_to_kernel_tm(&n)?
            .normalize()
            .map_err(kernel_error_to_js_error)?,
    ))
}

#[wasm_bindgen(js_name = "inferType")]
pub fn ty(n: &JsValue) -> Result<JsValue, JsValue> {
    Ok(kernel_tm_to_js_tm(
        &js_tm_to_kernel_tm(&n)?
            .ty()
            .map_err(kernel_error_to_js_error)?,
    ))
}

#[wasm_bindgen(js_name = "betaEquivalent")]
pub fn beta_eq(n: &JsValue, m: &JsValue) -> Result<JsValue, JsValue> {
    let n = js_tm_to_kernel_tm(&n)?;
    let m = js_tm_to_kernel_tm(&m)?;
    Ok(n.beta_eq(&m).map_err(kernel_error_to_js_error)?.into())
}
