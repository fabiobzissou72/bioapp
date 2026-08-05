alter table buttons drop constraint buttons_type_check;
alter table buttons add constraint buttons_type_check check (
  type in (
    'instagram','whatsapp','google_review','pix','wifi','address','booking','custom',
    'facebook','tiktok','youtube','x_twitter','linkedin','threads','telegram',
    'pinterest','snapchat','twitch','spotify','site','phone','email','quote'
  )
);
