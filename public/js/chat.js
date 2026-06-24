// js/chat.js

const SUPABASE_URL = "https://gornehhkjickglfnobvl.supabase.co";
const SUPABASE_ANON =
  "sb_publishable_q_MgJaoGSDjRjcmxhIoAjA_G8YIheFy";

const supabase = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON
);

async function handleChatSearch(query) {

  const results = document.getElementById("chat-search-results");

  if (!results) return;

  query = query.trim();

  if (query.length < 2) {
    results.classList.add("hidden");
    results.innerHTML = "";
    return;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select(`
      id,
      username,
      full_name,
      avatar_url,
      avatar_skin,
      college,
      course
    `)
    .or(
      `username.ilike.%${query}%,full_name.ilike.%${query}%,college.ilike.%${query}%,course.ilike.%${query}%`
    )
    .limit(20);

  if (error) {
    console.error(error);
    return;
  }

  results.classList.remove("hidden");
  results.innerHTML = "";

  if (!data.length) {
    results.innerHTML =
      "<div class='search-user'>No users found.</div>";
    return;
  }

  data.forEach(user => {

    const div = document.createElement("div");

    div.className = "search-user";

    div.innerHTML = `
      <img src="${user.avatar_url || "assets/default-avatar.png"}"
           width="42"
           height="42"
           style="border-radius:50%;object-fit:cover">

      <div>
        <strong>${user.full_name || "Unknown"}</strong><br>
        <span>@${user.username}</span><br>
        <small>${user.course || ""}</small>
      </div>
    `;

    div.onclick = () => {

      window.location.hash = `profile-${user.id}`;

      results.innerHTML = "";
      results.classList.add("hidden");

    };

    results.appendChild(div);

  });

}

function sendMessage() {

  console.log("Message sent");

}

window.handleChatSearch = handleChatSearch;
