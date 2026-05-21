<?php // I:\ptw\lab-f\yaml.php



$data = [

    'name' => 'Wiktor Schab',

    'index' => '57836',

    'date' => date(DATE_ATOM),

];



$yaml = yaml_emit($data);



echo $yaml;