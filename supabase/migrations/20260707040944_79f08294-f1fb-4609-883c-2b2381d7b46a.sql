
UPDATE public.articles
SET
  title = regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(title, '&apos;', '''', 'g'),
              '&quot;', '"', 'g'),
            '&#39;', '''', 'g'),
          '&#124;', '|', 'g'),
        '&nbsp;', ' ', 'g'),
      '&lt;', '<', 'g'),
    '&gt;', '>', 'g'),
  excerpt = regexp_replace(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          regexp_replace(
            regexp_replace(
              regexp_replace(COALESCE(excerpt,''), '&apos;', '''', 'g'),
              '&quot;', '"', 'g'),
            '&#39;', '''', 'g'),
          '&#124;', '|', 'g'),
        '&nbsp;', ' ', 'g'),
      '&lt;', '<', 'g'),
    '&gt;', '>', 'g')
WHERE title ~ '&(apos|quot|#39|#124|nbsp|lt|gt|amp|#\d+|#x[0-9a-fA-F]+);'
   OR excerpt ~ '&(apos|quot|#39|#124|nbsp|lt|gt|amp|#\d+|#x[0-9a-fA-F]+);';

-- Handle numeric entities generically for remaining rows (e.g. &#8217;)
UPDATE public.articles
SET title = (
  SELECT string_agg(
    CASE WHEN part ~ '^&#\d+;$'
      THEN chr(substring(part from '\d+')::int)
      WHEN part ~ '^&#x[0-9a-fA-F]+;$'
      THEN chr( ('x' || substring(part from '[0-9a-fA-F]+'))::bit(32)::int )
      ELSE part END,
    '')
  FROM regexp_split_to_table(title, '(&#\d+;|&#x[0-9a-fA-F]+;)') WITH ORDINALITY AS t(part, ord)
)
WHERE title ~ '&#(\d+|x[0-9a-fA-F]+);';
