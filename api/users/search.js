import { json, supabaseAdmin } from "../_utils.js";

export default async function handler(req, res) {

    if (req.method !== "GET")
        return json(res, 405, { error: "Method not allowed" });

    const q = (req.query.q || "").trim();

    if (!q)
        return json(res, 200, { users: [] });

    const { data, error } = await supabaseAdmin
        .from("profiles")
        .select(`
            id,
            username,
            full_name,
            avatar_skin,
            avatar_url,
            course,
            college,
            skills,
            xp,
            level
        `)
        .or(
            `username.ilike.%${q}%,
            full_name.ilike.%${q}%,
            course.ilike.%${q}%,
            college.ilike.%${q}%`
        )
        .limit(25);

    if (error)
        return json(res, 500, { error: error.message });

    return json(res, 200, {
        users: data
    });

}