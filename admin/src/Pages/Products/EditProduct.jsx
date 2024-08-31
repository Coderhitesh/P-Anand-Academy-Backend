import React, { useEffect, useState, useRef, useCallback } from 'react';
import axios from 'axios';
import { Link, useParams } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import JoditEditor from 'jodit-react';

const EditProduct = () => {
    const { id } = useParams(); // Assuming the product ID is passed via URL params
    const editor = useRef(null);
    const [categories, setCategories] = useState([]);
    const [allTags, setTags] = useState([]);
    const [subcategories, setSubcategories] = useState([]);
    const [imagePreview, setImagePreview] = useState(null); // Single image preview
    const [formData, setFormData] = useState({
        courseName: '',
        courseDescription: '',
        courseTagName: '',
        courseCategory: '',
        courseSubCategory: '',
        courseImage: null, // Single file
        courseMode: [],
        feature: false,
        startingPrice: '',
        endingPrice: ''
    });
    const [isLoading, setIsLoading] = useState(false);

    // Predefined course modes
    const courseModes = ['Live', 'Offline', 'Pen Drive', 'Google Drive'];

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        const preview = URL.createObjectURL(file);

        setFormData((prevFormData) => ({
            ...prevFormData,
            courseImage: file
        }));

        setImagePreview(preview);
    };

    const handleCategoryChange = async (e) => {
        const { value } = e.target;
        setFormData((prevFormData) => ({
            ...prevFormData,
            courseCategory: value,
            courseSubCategory: ''
        }));

        if (value) {
            try {
                const response = await axios.get(`http://localhost:9000/api/v1/single-category/${value}`);
                setSubcategories(response.data.data.subcategoryName);
            } catch (error) {
                console.error('Error fetching subcategories:', error);
                setSubcategories([]);
            }
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prevFormData) => ({
            ...prevFormData,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const calculateDiscountedPrice = (price, discountPercent) => {
        const discount = (price * discountPercent) / 100;
        return price - discount;
    };

    const handleCourseModeChange = (index, e) => {
        const { name, value } = e.target;
        const updatedCourseMode = [...formData.courseMode];
        updatedCourseMode[index] = {
            ...updatedCourseMode[index],
            [name]: value
        };

        // Calculate the discounted price when price or discount percent changes
        if (name === 'coursePrice' || name === 'courseDiscountPercent') {
            const price = parseFloat(updatedCourseMode[index].coursePrice) || 0;
            const discountPercent = parseFloat(updatedCourseMode[index].courseDiscountPercent) || 0;
            updatedCourseMode[index].coursePriceAfterDiscount = calculateDiscountedPrice(price, discountPercent);
        }

        if (name === 'modeType' && value !== 'Google Drive') {
            updatedCourseMode[index].courseLink = ''; // Reset courseLink if not Google Drive
        }

        setFormData((prevFormData) => ({
            ...prevFormData,
            courseMode: updatedCourseMode
        }));
    };

    const addCourseMode = () => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            courseMode: [...prevFormData.courseMode, { modeType: 'Live', coursePrice: '', coursePriceAfterDiscount: '', courseDiscountPercent: '', courseLink: '' }]
        }));
    };

    const removeCourseMode = (index) => {
        const updatedCourseMode = [...formData.courseMode];
        updatedCourseMode.splice(index, 1);
        setFormData((prevFormData) => ({
            ...prevFormData,
            courseMode: updatedCourseMode
        }));
    };

    const fetchCategories = useCallback(async () => {
        try {
            const res = await axios.get('http://localhost:9000/api/v1/get-all-category');
            setCategories(res.data.data);
        } catch (error) {
            console.error('There was an error fetching the categories!', error);
        }
    }, []);

    const fetchTags = useCallback(async () => {
        try {
            const res = await axios.get('http://localhost:9000/api/v1/get-all-tag');
            setTags(res.data.data);
        } catch (error) {
            console.error('There was an error fetching the tags!', error);
        }
    }, []);

    const fetchSingleProduct = useCallback(async () => {
        try {
            const res = await axios.get(`http://localhost:9000/api/v1/single-course/${id}`);
            const data = res.data.data;
            console.log(data)
            // Set form data
            setFormData({
                courseName: data.courseName,
                courseDescription: data.courseDescription,
                coursePrice: data.courseMode[0]?.coursePrice || '',
                courseDiscountPercent: data.courseMode[0]?.courseDiscountPercent || '',
                coursePriceAfterDiscount: data.courseMode[0]?.coursePriceAfterDiscount || '',
                courseCategory: data.courseCategory,
                courseSubCategory: data.courseSubCategory,
                courseTagName: data.courseTagName,
                courseImage: data.courseImage.url,
                startingPrice: data.startingPrice || '',
                endingPrice: data.endingPrice || '',
                courseMode: data.courseMode || [],
                feature: data.feature || false
            });

            if (data.courseImage) {
                setImagePreview(data.courseImage.url);
            }
        } catch (error) {
            console.error('There was an error fetching the product!', error);
        }
    }, [id]);

    useEffect(() => {
        fetchCategories();
        fetchTags();
        fetchSingleProduct();
    }, [fetchCategories, fetchTags, fetchSingleProduct]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const formDataToSend = new FormData();
//i love
            for (const key in formData) {
                if (key === 'courseMode') {
                    formDataToSend.append(key, JSON.stringify(formData[key]));
                } else if (key === 'courseImage') {
                    if (formData.courseImage) {
                        formDataToSend.append('courseImage', formData.courseImage);
                    }
                } else {
                    formDataToSend.append(key, formData[key]);
                }
            }

            const response = await axios.put(`http://localhost:9000/api/v1/update-course/${id}`, formDataToSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            toast.success('Course Updated Successfully');
            setIsLoading(false);
            window.location.href="/all-courses"
        } catch (error) {
            console.error('Error:', error);
            toast.error('An Error Occurred');
            setIsLoading(false);
        }
    };

    const editorConfig = {
        readonly: false,
        height: 400
    };

    const handleEditorChange = useCallback((newContent) => {
        console.log(newContent)
        setFormData(prevFormData => ({ ...prevFormData, courseDescription: newContent }));
    }, []);

    return (
        <>
            <ToastContainer />
            <div className="bread">
                <div className="head">
                    <h4>Edit Course</h4>
                </div>
                <div className="links">
                    <Link to="/all-courses" className="add-new">Back <i className="fa-regular fa-circle-left"></i></Link>
                </div>
            </div>

            <div className="d-form">
                <form className="row g-3" onSubmit={handleSubmit}>
                    <div className="col-md-6">
                        <label htmlFor="courseCategory" className="form-label">Category</label>
                        <select onChange={handleCategoryChange} name='courseCategory' value={formData.courseCategory} className="form-select" id="courseCategory">
                            <option value="">Choose Category</option>
                            {categories && categories.map((category, index) => (
                                <option key={index} value={category._id}>{category.categoryName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-md-6">
                        <label htmlFor="courseSubCategory" className="form-label">Sub Category</label>
                        <select onChange={handleChange} name='courseSubCategory' value={formData.courseSubCategory} className="form-select" id="courseSubCategory">
                            <option value="">Choose Sub Category</option>
                            {subcategories && subcategories.map((subcategory, index) => (
                                <option key={index} value={subcategory}>{subcategory}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-md-6">
                        <label htmlFor="courseName" className="form-label">Course Name</label>
                        <input type="text" className="form-control" id="courseName" name="courseName" value={formData.courseName} onChange={handleChange} />
                    </div>

                    <div className="col-md-6">
                        <label htmlFor="courseTagName" className="form-label">Course Tags</label>
                        <select className="form-select" id="courseTagName" name="courseTagName" value={formData.courseTagName} onChange={handleChange}>
                            {allTags && allTags.map((tag, index) => (
                                <option key={index} value={tag._id}>{tag.tagName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="col-md-12">
                        <label htmlFor="courseDescription" className="form-label">Course Description</label>
                        <JoditEditor
                            ref={editor}
                            value={formData.courseDescription}
                            config={editorConfig}
                            onChange={handleEditorChange}
                        />
                    </div>

                    {/* <div className="col-md-6">
                        <label htmlFor="courseImage" className="form-label">Course Image</label>
                        <input type="file" className="form-control" id="courseImage" name="courseImage" onChange={handleFileChange} />
                        {imagePreview && <img src={imagePreview} alt="Course Preview" className="img-preview" />}
                    </div> */}

                    <div className="col-md-12">
                        <h5>Course Modes</h5>
                        {formData.courseMode.map((mode, index) => (
                            <div className="row mb-3" key={index}>
                                <div className="col-md-3">
                                    <label htmlFor={`modeType-${index}`} className="form-label">Mode Type</label>
                                    <select name="modeType" id={`modeType-${index}`} className="form-select" value={mode.modeType} onChange={(e) => handleCourseModeChange(index, e)}>
                                        <option value="Live">Live</option>
                                        <option value="Offline">Offline</option>
                                        <option value="Pen Drive">Pen Drive</option>
                                        <option value="Google Drive">Google Drive</option>
                                    </select>
                                </div>

                                <div className="col-md-3">
                                    <label htmlFor={`coursePrice-${index}`} className="form-label">Price</label>
                                    <input type="number" name="coursePrice" id={`coursePrice-${index}`} className="form-control" value={mode.coursePrice} onChange={(e) => handleCourseModeChange(index, e)} />
                                </div>

                                <div className="col-md-3">
                                    <label htmlFor={`courseDiscountPercent-${index}`} className="form-label">Discount (%)</label>
                                    <input type="number" name="courseDiscountPercent" id={`courseDiscountPercent-${index}`} className="form-control" value={mode.courseDiscountPercent} onChange={(e) => handleCourseModeChange(index, e)} />
                                </div>

                                <div className="col-md-3">
                                    <label htmlFor={`coursePriceAfterDiscount-${index}`} className="form-label">Price After Discount</label>
                                    <input type="number" name="coursePriceAfterDiscount" id={`coursePriceAfterDiscount-${index}`} className="form-control" value={mode.coursePriceAfterDiscount} readOnly />
                                </div>

                                {mode.modeType === 'Google Drive' && (
                                    <div className="col-md-12">
                                        <label htmlFor={`courseLink-${index}`} className="form-label">Google Drive Link</label>
                                        <input type="text" name="courseLink" id={`courseLink-${index}`} className="form-control" value={mode.courseLink} onChange={(e) => handleCourseModeChange(index, e)} />
                                    </div>
                                )}

                                <div className="col-md-12 mt-4">
                                    <button type="button" className="btn btn-danger" onClick={() => removeCourseMode(index)}>Remove Mode</button>
                                </div>
                            </div>
                        ))}

                        <button type="button" className="btn btn-primary" onClick={addCourseMode}>Add More Mode</button>
                    </div>

                    <div className="col-md-6">
                        <label htmlFor="startingPrice" className="form-label">Starting Price</label>
                        <input type="number" className="form-control" id="startingPrice" name="startingPrice" value={formData.startingPrice} onChange={handleChange} />
                    </div>

                    <div className="col-md-6">
                        <label htmlFor="endingPrice" className="form-label">Ending Price</label>
                        <input type="number" className="form-control" id="endingPrice" name="endingPrice" value={formData.endingPrice} onChange={handleChange} />
                    </div>

                    <div className="col-md-6">
                        <div className="form-check">
                            <input type="checkbox" className="form-check-input" id="feature" name="feature" checked={formData.feature} onChange={handleChange} />
                            <label className="form-check-label" htmlFor="feature">Feature</label>
                        </div>
                    </div>

                    <div className="col-md-12">
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default EditProduct;
