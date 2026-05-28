<?php
    /** @var $book ?\App\Model\Book */
?>

<div class="form-group">
    <label for="title">Title</label>
    <input type="text" id="title" name="book[title]" value="<?= $book ? $book->getTitle() : '' ?>">
</div>

<div class="form-group">
    <label for="author">Author</label>
    <input type="text" id="author" name="book[author]" value="<?= $book ? $book->getAuthor() : '' ?>">
</div>

<div class="form-group">
    <label for="description">Description</label>
    <textarea id="description" name="book[description]"><?= $book? $book->getDescription() : '' ?></textarea>
</div>

<div class="form-group">
    <label></label>
    <input type="submit" value="Submit">
</div>

