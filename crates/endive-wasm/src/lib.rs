//! WebAssembly interface to Endive.

use endive_kernel::{univ_lvl, Binding, Case, GlobalEnv, Ix, Tm};
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
        "inductive" => {
            let idx = Reflect::get(&value, &JsValue::from_str("index"))?
                .as_f64()
                .ok_or_else(|| TypeError::new("Inductive index must be a number"))?
                as usize;
            let args = Reflect::get(&value, &JsValue::from_str("arguments"))?
                .dyn_ref::<Array>()
                .ok_or_else(|| TypeError::new("Inductive arguments must be an array"))?
                .iter()
                .map(|ctor| js_tm_to_kernel_tm(&ctor))
                .collect::<Result<Vec<_>, _>>()?;
            let indices = Reflect::get(&value, &JsValue::from_str("arguments"))?
                .dyn_ref::<Array>()
                .ok_or_else(|| TypeError::new("Inductive indices must be an array"))?
                .iter()
                .map(|ctor| js_tm_to_kernel_tm(&ctor))
                .collect::<Result<Vec<_>, _>>()?;
            Ok(Tm::Inductive { idx, args, indices })
        }
        "constructor" => {
            let inductive_idx = Reflect::get(&value, &JsValue::from_str("inductiveIndex"))?
                .as_f64()
                .ok_or_else(|| TypeError::new("Inductive index must be a number"))?
                as usize;
            let inductive_args = Reflect::get(&value, &JsValue::from_str("inductiveArguments"))?
                .dyn_ref::<Array>()
                .ok_or_else(|| TypeError::new("Inductive arguments must be an array"))?
                .iter()
                .map(|ctor| js_tm_to_kernel_tm(&ctor))
                .collect::<Result<Vec<_>, _>>()?;
            let ctor_idx = Reflect::get(&value, &JsValue::from_str("constructorIndex"))?
                .as_f64()
                .ok_or_else(|| TypeError::new("Constructor index must be a number"))?
                as usize;
            let ctor_args = Reflect::get(&value, &JsValue::from_str("inductiveArguments"))?
                .dyn_ref::<Array>()
                .ok_or_else(|| TypeError::new("Inductive arguments must be an array"))?
                .iter()
                .map(|ctor| js_tm_to_kernel_tm(&ctor))
                .collect::<Result<Vec<_>, _>>()?;
            Ok(Tm::Ctor {
                inductive_idx,
                inductive_args,
                ctor_idx,
                ctor_args,
            })
        }
        "induction" => {
            let inductive_idx = Reflect::get(&value, &JsValue::from_str("inductiveIndex"))?
                .as_f64()
                .ok_or_else(|| TypeError::new("Inductive index must be a number"))?
                as usize;
            let inductive_args = Reflect::get(&value, &JsValue::from_str("inductiveArguments"))?
                .dyn_ref::<Array>()
                .ok_or_else(|| TypeError::new("Inductive arguments must be an array"))?
                .iter()
                .map(|ctor| js_tm_to_kernel_tm(&ctor))
                .collect::<Result<Vec<_>, _>>()?;
            let motive = js_tm_to_kernel_tm(&Reflect::get(&value, &JsValue::from_str("motive"))?)?;
            let cases = Reflect::get(&value, &JsValue::from_str("cases"))?
                .dyn_ref::<Array>()
                .ok_or_else(|| TypeError::new("Induction cases must be an array"))?
                .iter()
                .map(|case| {
                    let param_count = Reflect::get(&case, &JsValue::from_str("parameterCount"))?
                        .as_f64()
                        .ok_or_else(|| TypeError::new("Case parameter count must be a number"))?
                        as usize;
                    let body = Reflect::get(&case, &JsValue::from_str("body"))?;
                    Ok::<_, JsValue>(Case {
                        param_count,
                        body: js_tm_to_kernel_tm(&body)?,
                    })
                })
                .collect::<Result<Vec<_>, _>>()?;
            let val = js_tm_to_kernel_tm(&Reflect::get(&value, &JsValue::from_str("value"))?)?;
            Ok(Tm::Induction {
                inductive_idx,
                inductive_args,
                motive: Box::new(motive),
                cases,
                val: Box::new(val),
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
        Tm::Inductive { idx, args, indices } => {
            let obj = Object::new();
            Reflect::set(
                &obj,
                &JsValue::from_str("type"),
                &JsValue::from_str("inductive"),
            )
            .unwrap();
            Reflect::set(
                &obj,
                &JsValue::from_str("index"),
                &JsValue::from_f64(*idx as f64),
            )
            .unwrap();
            let args = args
                .iter()
                .map(|arg| kernel_tm_to_js_tm(arg))
                .collect::<Array>();
            Reflect::set(&obj, &JsValue::from_str("arguments"), &args).unwrap();
            let indices = indices
                .iter()
                .map(|idx| kernel_tm_to_js_tm(idx))
                .collect::<Array>();
            Reflect::set(&obj, &JsValue::from_str("indices"), &indices).unwrap();
            obj.into()
        }
        Tm::Ctor {
            inductive_idx,
            inductive_args,
            ctor_idx,
            ctor_args,
        } => {
            let obj = Object::new();
            Reflect::set(
                &obj,
                &JsValue::from_str("type"),
                &JsValue::from_str("constructor"),
            )
            .unwrap();
            Reflect::set(
                &obj,
                &JsValue::from_str("inductiveIndex"),
                &JsValue::from_f64(*inductive_idx as f64),
            )
            .unwrap();
            let inductive_args = inductive_args
                .iter()
                .map(|arg| kernel_tm_to_js_tm(arg))
                .collect::<Array>();
            Reflect::set(
                &obj,
                &JsValue::from_str("inductiveArguments"),
                &inductive_args,
            )
            .unwrap();
            Reflect::set(
                &obj,
                &JsValue::from_str("constructorIndex"),
                &JsValue::from_f64(*ctor_idx as f64),
            )
            .unwrap();
            let ctor_args = ctor_args
                .iter()
                .map(|arg| kernel_tm_to_js_tm(arg))
                .collect::<Array>();
            Reflect::set(&obj, &JsValue::from_str("constructorArguments"), &ctor_args).unwrap();
            obj.into()
        }
        Tm::Induction {
            inductive_idx,
            inductive_args,
            motive,
            cases,
            val,
        } => {
            let obj = Object::new();
            Reflect::set(
                &obj,
                &JsValue::from_str("type"),
                &JsValue::from_str("induction"),
            )
            .unwrap();
            Reflect::set(
                &obj,
                &JsValue::from_str("inductiveIndex"),
                &JsValue::from_f64(*inductive_idx as f64),
            )
            .unwrap();
            let inductive_args = inductive_args
                .iter()
                .map(|arg| kernel_tm_to_js_tm(arg))
                .collect::<Array>();
            Reflect::set(
                &obj,
                &JsValue::from_str("inductiveArguments"),
                &inductive_args,
            )
            .unwrap();
            Reflect::set(
                &obj,
                &JsValue::from_str("motive"),
                &kernel_tm_to_js_tm(motive),
            )
            .unwrap();
            let cases = cases
                .iter()
                .map(|case| {
                    let obj = Object::new();
                    Reflect::set(
                        &obj,
                        &JsValue::from_str("parameterCount"),
                        &JsValue::from_f64(case.param_count as f64),
                    )
                    .unwrap();
                    Reflect::set(
                        &obj,
                        &JsValue::from_str("body"),
                        &kernel_tm_to_js_tm(&case.body),
                    )
                    .unwrap();
                    JsValue::from(obj)
                })
                .collect::<Array>();
            Reflect::set(&obj, &JsValue::from_str("cases"), &cases).unwrap();
            Reflect::set(&obj, &JsValue::from_str("value"), &kernel_tm_to_js_tm(val)).unwrap();
            obj.into()
        }
    }
}

fn kernel_error_to_js_error(err: endive_kernel::Error) -> JsValue {
    match err {
        endive_kernel::Error::IxOverflow => Error::new("Index overflow").into(),
        endive_kernel::Error::TyMismatch => Error::new("Type mismatch").into(),
        endive_kernel::Error::InductiveOutOfBound => {
            Error::new("Inductive index out of bounds").into()
        }
        endive_kernel::Error::CtorOutOfBound => {
            Error::new("Constructor index out of bounds").into()
        }
    }
}

#[wasm_bindgen]
pub fn normalize(n: &JsValue) -> Result<JsValue, JsValue> {
    Ok(kernel_tm_to_js_tm(
        &js_tm_to_kernel_tm(&n)?
            .normalize(&GlobalEnv::new())
            .map_err(kernel_error_to_js_error)?,
    ))
}

#[wasm_bindgen(js_name = "inferType")]
pub fn ty(n: &JsValue) -> Result<JsValue, JsValue> {
    Ok(kernel_tm_to_js_tm(
        &js_tm_to_kernel_tm(&n)?
            .ty(&GlobalEnv::new())
            .map_err(kernel_error_to_js_error)?,
    ))
}

#[wasm_bindgen(js_name = "betaEquivalent")]
pub fn beta_eq(n: &JsValue, m: &JsValue) -> Result<JsValue, JsValue> {
    let n = js_tm_to_kernel_tm(&n)?;
    let m = js_tm_to_kernel_tm(&m)?;
    Ok(n.beta_eq(&GlobalEnv::new(), &m)
        .map_err(kernel_error_to_js_error)?
        .into())
}
