<?php

// Funkcja parsująca formaty rozdzielane (CSV, SSV, TSV) na tablicę asocjacyjną
function parse_delimited(string $text, string $delimiter): array {
    $lines = explode("\n", trim($text));
    if (empty($lines)) return [];
    // Pierwsza linia to zawsze nagłówek
    $header = str_getcsv(array_shift($lines), $delimiter, '"', '\\');
    $data = [];
    foreach ($lines as $line) {
        if (trim($line) === '') continue;
        // Parsowanie kolejnych wierszy
        $row = str_getcsv($line, $delimiter, '"', '\\');
        $row = array_pad($row, count($header), '');
        $row = array_slice($row, 0, count($header));
        $data[] = array_combine($header, $row);
    }
    return $data;
}

// Funkcja kodująca tablicę asocjacyjną na formaty rozdzielane (CSV, SSV, TSV)
function encode_delimited(array $data, string $delimiter): string {
    if (empty($data)) return '';
    $headers = array_keys($data[0]);
    $fp = fopen('php://memory', 'r+');
    // Zapis nagłówków
    fputcsv($fp, $headers, $delimiter, '"', '\\');
    foreach ($data as $row) {
        // Zapis wierszy
        fputcsv($fp, $row, $delimiter, '"', '\\');
    }
    rewind($fp);
    $result = stream_get_contents($fp);
    fclose($fp);
    return rtrim($result, "\r\n");
}

// Yaml
function parse_yaml(string $text): array {
    $lines = explode("\n", $text);
    $data = [];
    $item = [];
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '') continue;
        if (str_starts_with($line, '- ')) {
            if (!empty($item)) $data[] = $item;
            $item = [];
            $line = substr($line, 2);
        }
        $parts = explode(':', $line, 2);
        if (count($parts) === 2) $item[trim($parts[0])] = trim($parts[1]);
    }
    if (!empty($item)) $data[] = $item;
    return $data;
}

// Yaml
function encode_yaml(array $data): string {
    $yaml = "";
    foreach ($data as $item) {
        $first = true;
        foreach ($item as $key => $value) {
            $yaml .= $first ? "- $key: $value\n" : "  $key: $value\n";
            $first = false;
        }
    }
    return rtrim($yaml);
}

// Json
function parse_json(string $text): array {
    $data = [];
    // Wyszukujemy zawartość wewnątrz klamer {} reprezentujących obiekty
    preg_match_all('/{([^}]+)}/', $text, $matches);
    foreach ($matches[1] as $block) {
        $item = [];
        $pairs = explode(',', $block);
        foreach ($pairs as $pair) {
            $parts = explode(':', $pair, 2);
            if (count($parts) === 2) {
                // Usuwamy spacje oraz cudzysłowy z kluczy i wartości
                $key = trim($parts[0], " \t\n\r\0\x0B\"");
                $val = trim($parts[1], " \t\n\r\0\x0B\"");
                $item[$key] = $val;
            }
        }
        if (!empty($item)) $data[] = $item;
    }
    return $data;
}

// Json
function encode_json(array $data): string {
    if (empty($data)) return "[]";
    $json = "[\n";
    $lastObj = count($data) - 1;
    foreach ($data as $i => $item) {
        $json .= "  {\n";
        $lastProp = count($item) - 1;
        $j = 0;
        foreach ($item as $key => $value) {
            $json .= "    \"$key\": \"$value\"";
            $json .= ($j < $lastProp) ? ",\n" : "\n";
            $j++;
        }
        $json .= "  }";
        $json .= ($i < $lastObj) ? ",\n" : "\n";
    }
    $json .= "]";
    return $json;
}

// Inicjalizacja domyślnych wartości zmiennych formularza
$inputText = '';
$inputFormat = 'CSV';
$outputFormat = 'CSV';
$outputText = '';

// Obsługa przesłania formularza metodą POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $inputText = $_POST['input_text'] ?? '';
    $inputFormat = $_POST['input_format'] ?? 'CSV';
    $outputFormat = $_POST['output_format'] ?? 'CSV';

    // Zapisanie przesłanych danych w ciasteczkach na 30 dni
    setcookie('input_text', $inputText, time() + (86400 * 30), "/");
    setcookie('input_format', $inputFormat, time() + (86400 * 30), "/");
    setcookie('output_format', $outputFormat, time() + (86400 * 30), "/");

    if (!empty($inputText)) {
        // Konwersja wejścia na uniwersalną tablicę danych
        $parsedData = [];
        if ($inputFormat === 'CSV') $parsedData = parse_delimited($inputText, ',');
        // Obsługa formatu SSV (średnik)
        if ($inputFormat === 'SSV') $parsedData = parse_delimited($inputText, ';');
        // Obsługa formatu TSV (tabulacja)
        if ($inputFormat === 'TSV') $parsedData = parse_delimited($inputText, "\t");
        if ($inputFormat === 'JSON') $parsedData = parse_json($inputText);
        if ($inputFormat === 'YAML') $parsedData = parse_yaml($inputText);

        // Generowanie danych wyjściowych w wybranym formacie
        if ($inputFormat === $outputFormat) {
            // Warunek: ten sam format na wejściu i wyjściu zwraca identyczny tekst
            $outputText = $inputText;
        } else {
            if ($outputFormat === 'CSV') $outputText = encode_delimited($parsedData, ',');
            if ($outputFormat === 'SSV') $outputText = encode_delimited($parsedData, ';');
            if ($outputFormat === 'TSV') $outputText = encode_delimited($parsedData, "\t");
            if ($outputFormat === 'JSON') $outputText = encode_json($parsedData);
            if ($outputFormat === 'YAML') $outputText = encode_yaml($parsedData);
        }
    }
} else {
    // Odczyt danych z ciasteczek w przypadku pierwszego wejścia
    $inputText = $_COOKIE['input_text'] ?? '';
    $inputFormat = $_COOKIE['input_format'] ?? 'CSV';
    $outputFormat = $_COOKIE['output_format'] ?? 'CSV';
}

?>
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <title>Wiktor Schab (57836) - PTW LAB F</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f9;
            color: #333;
            max-width: 600px;
            margin: 40px auto;
            padding: 20px;
            background: #fff;
            border-radius: 8px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        label {
            font-weight: bold;
        }
        textarea, select {
            width: 100%;
            padding: 10px;
            margin-top: 5px;
            border: 1px solid #ccc;
            border-radius: 4px;
            box-sizing: border-box;
        }
        button {
            background-color: #0056b3;
            color: #fff;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
        }
        button:hover {
            background-color: #004494;
        }
        pre {
            background-color: #272822;
            color: #f8f8f2;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
        }
    </style>
</head>
<body>

<form method="POST">
    <label>Dane wejściowe:</label><br>
    <textarea name="input_text" rows="10" cols="50"><?= htmlspecialchars($inputText) ?></textarea><br><br>

    <label>Format wejściowy:</label>
    <select name="input_format">
        <?php foreach (['CSV', 'SSV', 'TSV', 'JSON', 'YAML'] as $f): ?>
            <option value="<?= $f ?>" <?= $inputFormat === $f ? 'selected' : '' ?>><?= $f ?></option>
        <?php endforeach; ?>
    </select><br><br>

    <label>Format wyjściowy:</label>
    <select name="output_format">
        <?php foreach (['CSV', 'SSV', 'TSV', 'JSON', 'YAML'] as $f): ?>
            <option value="<?= $f ?>" <?= $outputFormat === $f ? 'selected' : '' ?>><?= $f ?></option>
        <?php endforeach; ?>
    </select><br><br>

    <button type="submit">Konwertuj i Zapisz</button>
</form>

<h2>Wynik:</h2>
<pre><?= htmlspecialchars($outputText) ?></pre>

</body>
</html>
<!-- Design strony wygenerowany przez gemini 3.5 flash -->