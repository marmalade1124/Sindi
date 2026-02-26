import os
import requests

screens = [
    {
        "name": "1_Sindi_Onboarding",
        "screenshot": "https://lh3.googleusercontent.com/aida/AOfcidV8YQerim-7QnsFwXXSsnna6WNQx3bL7tWki6AkY0FAkozJAvanq4Rsx50waThUgEmum798YbwVR5FtSwsIBvhYypTyMvivHj4cJ_Y4lgr8_ikEBurI24cd-R_N3OUqq9XWLVUMvr1qEo8CUY6QtnqthsCBlNlVjaKpR64v7cuBbaAutDsYcD8PlEBdmuQgAFhf1v29OlIyli_CpNmi-x_FVtMzksK1EOsgWEktlXnmSai7rWC1JBBw-iw",
        "html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2NlMjUxNGMxMTYwODQyMDhiMzJiOTY3MDdmZTcxOGIxEgsSBxC-hcOPqQgYAZIBIwoKcHJvamVjdF9pZBIVQhMzMDU0NjY4NzYzMjQ3NDU0ODI0&filename=&opi=89354086"
    },
    {
        "name": "2_Set_Your_Location",
        "screenshot": "https://lh3.googleusercontent.com/aida/AOfcidXd9IyHYufIgJjWaCC8RquL9ijLxH0iFCuvrHVyT3OmEK5C2MR6_vf033V_exJFhFiEobLE9y0CIImBbIioRmw8jUxls-ogzjh9pJguw5kStexfrEotIhmFRYoKU3MQLdvAyUCO61IW5WN9KVVe9hL3X0jyNpJx5TOY8cZMgmkWanG_PGwOg5RmvCASRjdeHt9LzJkAiOtWNXQSiybo7iz_tdrRAxEDCvtDsJQ0D6_D67AXdazZN1-sFSc",
        "html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzU5NWI2YWI4ZWFiYjRmMzZiZGQ0MWVmNmIyMDBkNGY3EgsSBxC-hcOPqQgYAZIBIwoKcHJvamVjdF9pZBIVQhMzMDU0NjY4NzYzMjQ3NDU0ODI0&filename=&opi=89354086"
    },
    {
        "name": "3_Sindi_Dashboard",
        "screenshot": "https://lh3.googleusercontent.com/aida/AOfcidWTCL4tnovNWRGj5ASl8_kLzQbe8nQ9wTuOaSLlCw81ojGV5mW_B3wRx4o195Nh9XkJCXWZPpHkOG7IC3UOJEL_TNymmHTAKQs2KETBoAh4OYYzEgY_WHrjoDr01TdenHsduXqNo6uS_FEeYITyUER44DBJyKA3XMv4TLHwzz60VpOEw1MwKPESRIH0Pj8HTV8ckAS2h8pURbxnYbLY5d56AxfM2w2sXeNdXS9ej4KxP0RdLWK0JQ9BRg",
        "html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzkzZjkwNTQ5N2Y1YzRkNmE4ZWNmNWExNDVlNzRjZDE0EgsSBxC-hcOPqQgYAZIBIwoKcHJvamVjdF9pZBIVQhMzMDU0NjY4NzYzMjQ3NDU0ODI0&filename=&opi=89354086"
    },
    {
        "name": "4_Outage_Details",
        "screenshot": "https://lh3.googleusercontent.com/aida/AOfcidX_pnE5bCtbrALTe02uaMLc8ZAfDEMg6vTnSVy4P-6OZ7XoUyyeruWXsjQFiYHzhj4Ujx2vPaYWpoS8_abLidpHCd71IoPg9zlKZ_h_gsu1wn_57lj22HHXfxYFlTWKCSmh1K2u-hXomfz4PiSeabulukOS_jEzl2SNQ2p5Edxj7hvGkS2MvWcinjNOADOMW2WbOFZSie8GU1MtfsUadUPdTKmLXJDm7hsQEwEiXW0IxMBv4-6XSx2D5w",
        "html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzFhNWEzNDVkZDYxNzRhZmU5NTZhMTk0ZWU1NTJmZDJiEgsSBxC-hcOPqQgYAZIBIwoKcHJvamVjdF9pZBIVQhMzMDU0NjY4NzYzMjQ3NDU0ODI0&filename=&opi=89354086"
    },
    {
        "name": "5_Alert_Notifications",
        "screenshot": "https://lh3.googleusercontent.com/aida/AOfcidUiglJeZaGtmXRtGvfLBWOQxgFb4lwyWTotH4cotMRmF_mNKfthp5vHO1LD74Rx9w7O3FU_0v1E1026ThIKleHtToYjlFUsGPMjPAx4qjMMIH2UOVFrDHHabmsku2GerbyFpMVuWSIndr1P0oLg4aiCtvBERU1_YA-zR1wjY7Ca6eFsE-PuNFF5NlB5WYHfV9E1VPz7_z0pOHkAAnDt6rHzwjxJ3keIANR94LNt-CfE38r1vkhOxKk6sCw",
        "html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2ZkMTcwZDYwYzY0ZjQ5Yzg4YzZkODNlNzhlMDk2NDE1EgsSBxC-hcOPqQgYAZIBIwoKcHJvamVjdF9pZBIVQhMzMDU0NjY4NzYzMjQ3NDU0ODI0&filename=&opi=89354086"
    },
    {
        "name": "6_App_Settings",
        "screenshot": "https://lh3.googleusercontent.com/aida/AOfcidU2fd9hpGDkb6A71ry5tS-QtrXRXQg_xTvTO-qxt7gDJXsboHSn3Z8oMIdM7r02czDkYAor9rx0QSb6CWqQ37EahUe35rAQpHcvAKB1u0k-p0AtlSapeTJ7C3mVxSYPYZwhNJ_eJ3Raw4Dnyo1-VRbIAARtC3o8Vw6F_UawkMvtlemNTp3z0ueteDmsFza7VZ8D2-WAL6c7eK3Hzgp3OfVOVC7vow5qI-9Rf2jRSeDMyjVv72cTP1h0-yM",
        "html": "https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2JhNzg4MzIzMTVmYTQyMjg4ZDBhMGU5ZmFlZmM0YjNlEgsSBxC-hcOPqQgYAZIBIwoKcHJvamVjdF9pZBIVQhMzMDU0NjY4NzYzMjQ3NDU0ODI0&filename=&opi=89354086"
    }
]

out_dir = r"c:\Users\razie\Downloads\Code Projects\Sindi\ui_designs"
os.makedirs(out_dir, exist_ok=True)

for screen in screens:
    name = screen["name"]
    print(f"Downloading {name}...")
    
    # Download Screenshot
    try:
        r_img = requests.get(screen["screenshot"])
        r_img.raise_for_status()
        with open(os.path.join(out_dir, f"{name}.png"), "wb") as f:
            f.write(r_img.content)
    except Exception as e:
        print(f"Failed to download screenshot for {name}: {e}")
        
    # Download HTML
    try:
        r_html = requests.get(screen["html"])
        r_html.raise_for_status()
        with open(os.path.join(out_dir, f"{name}.html"), "w", encoding="utf-8") as f:
            f.write(r_html.text)
    except Exception as e:
        print(f"Failed to download HTML for {name}: {e}")

print("Done downloading all UI designs.")
