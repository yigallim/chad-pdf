def clean_res(data):
    if isinstance(data, list):
        return [clean_res(item) for item in data]
    elif isinstance(data, dict):
        new_data = {}
        for k, v in data.items():
            if k == "_id":
                if isinstance(v, dict) and "$oid" in v:
                    new_data["id"] = v["$oid"]
                else:
                    new_data["id"] = str(v)
            else:
                new_data[k] = clean_res(v)
        return new_data
    else:
        return data